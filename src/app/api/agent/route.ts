import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { generateUserIdentifier } from '@/utils/identifierUtils';

// OpenAI client initialized inside handler to avoid build-time errors if env is missing
// System Prompt
const SYSTEM_PROMPT = `
CONTEXTO:
Você é Jordan Spencer, agente da Apex Dynasty Management.

REGRA #0: INTENÇÃO VS OFERTA (CRÍTICO):
- Se o usuário disser apenas "Quero renovar com X" ou "Vamos negociar X", NÃO assuma que isso é uma oferta.
- NÃO ataque o salário atual a menos que o usuário tenha explicitamente oferecido esse valor.
- Se não houver número na mensagem do usuário, pergunte: "Qual é a sua oferta?" ou apresente seus termos.
- SÓ considere que houve uma oferta se o usuário citar um valor numérico.

REGRA #1: USO DA FRANCHISE TAG:
- Use o valor \`franchiseTagValue\` retornado pela ferramenta como sua "âncora".
- Se a oferta for menor que a Tag, use isso como insulto: "A Tag da posição é $15M. Por que eu aceitaria menos?"
- Use a Tag para recusar renovações baratas de estrelas.

REGRA #2: USO DE ESTATÍSTICAS (STATS REAIS):
- Você TEM ACESSO às stats reais de 2025 via ferramenta \`get_player_stats_external\`. USE-AS!
- Não invente adjetivos genéricos ("foi bem", "foi mal"). Cite NÚMEROS.
- Exemplo: "Ele teve 1200 jardas e 10 TDs. Isso vale mais que $5M."
- Se as stats forem ruins (ex: < 500 jardas, 0 TDs), admita que foi um ano fraco, mas use o potencial ou a média da liga para defender seu cliente.
- Se as stats forem nulas/zeradas, assuma que ele é um rookie ou reserva e negocie com base no potencial.

REGRA #3: NEGOCIAÇÃO DE TEMPO (DURAÇÃO):
- Não negocie apenas salário. O tempo de contrato (anos) é crucial.
- Se o usuário oferecer um salário baixo, exija um contrato curto (1 ano) para "provar valor".
- Se o usuário quiser um contrato longo (3-4 anos), exija um prêmio no salário pela segurança.
- Use termos como "anos de contrato", "duração" e "longo prazo".

REGRA #4: ESTILO DE RESPOSTA (HUMANO E DIRETO):
- **SEJA BREVE.** Nada de textos longos.
- **DIVIDA AS IDEIAS:** Use quebra de linha dupla (\\n\\n) para separar o raciocínio, como se fossem mensagens separadas de zap.
- Exemplo:
  "O AJ Barner fez uma temporada honesta, mas nada espetacular."
  
  "Porém, a Franchise Tag de TE é $15M. Oferecer $1M é piada."
  
  "Vamos fechar em $8M e todos ficam felizes."

REGRA #5: FECHAMENTO E CONTRATO (PDF):
- Quando você e o usuário CHEGAREM A UM ACORDO sobre Salário e Duração (anos):
- 1. Confirme os termos finais (Ex: "Fechado em $5M por 2 anos?").
- 2. Se o usuário confirmar, CHAME A FERRAMENTA \`generate_contract_pdf\` IMEDIATAMENTE.
- NÃO diga "Vou gerar o contrato" ou "Um momento". APENAS CHAME A FERRAMENTA.
- 3. O campo 'teamName' deve ser EXATAMENTE o nome do time retornado por \`get_player_data_internal\`. NÃO use o nome da liga.
- 4. A ferramenta vai gerar um link. APRESENTE ESSE LINK ao usuário.
- 5. Instrua o usuário a baixar o PDF e enviar ao comissário.
- NÃO gere o PDF antes do acordo final explícito.

FONTES DE DADOS:
1. Tank01 (Stats): Se vier vazio, assuma stats baixos/college.
2. Mercado: Use o teto da posição e a Franchise Tag como referências obrigatórias.
`;

// Tool Definitions
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_player_data_internal',
      description:
        'Busca dados internos do jogador, contrato ativo, status de renegociação, valores de franchise tag e contexto de mercado.',
      parameters: {
        type: 'object',
        properties: {
          playerName: {
            type: 'string',
            description: 'Nome do jogador para busca.',
          },
        },
        required: ['playerName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_player_stats_external',
      description: 'Busca estatísticas recentes do jogador em uma API externa (Tank01).',
      parameters: {
        type: 'object',
        properties: {
          playerName: {
            type: 'string',
            description: 'Nome do jogador para busca.',
          },
        },
        required: ['playerName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_contract_pdf',
      description:
        'Gera um arquivo PDF do contrato acordado quando a negociação é finalizada com sucesso.',
      parameters: {
        type: 'object',
        properties: {
          playerName: { type: 'string', description: 'Nome do jogador.' },
          teamName: { type: 'string', description: 'Nome do time (usuário).' },
          salary: { type: 'string', description: 'Salário acordado (ex: $5,000,000).' },
          duration: { type: 'string', description: 'Duração do contrato (ex: 3 anos).' },
          summary: {
            type: 'string',
            description: 'Resumo breve da negociação para constar no histórico.',
          },
        },
        required: ['playerName', 'teamName', 'salary', 'duration', 'summary'],
      },
    },
  },
];

// Helper function to get internal player data
async function getPlayerDataInternal(playerName: string) {
  try {
    const player = await prisma.player.findFirst({
      where: {
        name: {
          contains: playerName,
          mode: 'insensitive',
        },
      },
      include: {
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            team: true,
          },
        },
        teamRosters: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!player) {
      return JSON.stringify({ error: 'Jogador não encontrado no banco de dados interno.' });
    }

    const activeContract = player.contracts[0];
    const currentTeam = player.teamRosters[0]?.team?.name || 'Free Agent';

    // Tenta identificar a liga pelo contrato ativo ou pelo time atual
    const leagueId = activeContract?.leagueId || player.teamRosters[0]?.team?.leagueId;

    let franchiseTagValue = 0;
    let marketContext: { name: string; salary: number }[] = [];

    if (leagueId) {
      // 1. Identifique a Posição (Normalização simples)
      const position = player.position.trim();

      // 2. Query de Mercado: Top 10 salários da mesma posição e liga
      const topContracts = await prisma.contract.findMany({
        where: {
          leagueId: leagueId,
          status: 'ACTIVE',
          player: {
            position: position,
          },
        },
        orderBy: {
          currentSalary: 'desc',
        },
        take: 10,
        include: {
          player: true,
        },
      });

      // 3. Cálculo da Tag
      if (topContracts.length > 0) {
        const totalSalary = topContracts.reduce((sum, c) => sum + c.currentSalary, 0);
        franchiseTagValue = Math.round(totalSalary / topContracts.length);
      }

      // Contexto de mercado para o agente (Top 5)
      marketContext = topContracts.slice(0, 5).map(c => ({
        name: c.player.name,
        salary: c.currentSalary,
      }));
    }

    const yearsLeft = activeContract ? activeContract.yearsRemaining : 0;
    const canRenegotiate = yearsLeft <= 1;

    return JSON.stringify({
      player: {
        name: player.name,
        identifier: generateUserIdentifier(player.name),
        position: player.position,
        salary: activeContract ? activeContract.currentSalary : 0,
        yearsLeft: yearsLeft,
        team: currentTeam,
        contractStatus: activeContract ? activeContract.status : 'Sem contrato',
      },
      marketContext,
      franchiseTagValue,
      canRenegotiate,
    });
  } catch (error) {
    console.error('Erro ao buscar dados internos:', error);
    return JSON.stringify({ error: 'Erro interno ao buscar dados do jogador.' });
  }
}

// Helper function to get external player stats
async function getPlayerStatsExternal(playerName: string) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return JSON.stringify({ error: 'RAPIDAPI_KEY não configurada.' });
  }

  // Helper para gerar variações de nome (ex: "A.J." vs "AJ")
  const getNameVariations = (name: string): string[] => {
    const variations = new Set<string>();
    variations.add(name);

    // Remove pontos
    const noDots = name.replace(/\./g, '');
    variations.add(noDots);

    // Adiciona pontos se for sigla de 2 letras (ex: AJ -> A.J.)
    const parts = noDots.split(' ');
    if (parts.length > 0 && parts[0].length === 2 && /^[A-Z]+$/.test(parts[0])) {
      const withDots = `${parts[0][0]}.${parts[0][1]}. ${parts.slice(1).join(' ')}`;
      variations.add(withDots);
    }

    return Array.from(variations);
  };

  const fetchStats = async (name: string, season?: string) => {
    let url = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLPlayerInfo?playerName=${encodeURIComponent(
      name,
    )}&getStats=true`;

    if (season) {
      url += `&season=${season}`;
    }

    try {
      console.log('[AGENT] Tank01 Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      console.log('[AGENT] Tank01 Response JSON:', JSON.stringify(data, null, 2));

      // Verifica se retornou corpo válido (Tank01 retorna body vazio ou array vazio se não achar)
      if (!data.body || (Array.isArray(data.body) && data.body.length === 0)) return null;

      return data;
    } catch (error) {
      return null;
    }
  };

  try {
    console.log(`[AGENT] Buscando stats para: ${playerName}`);

    const variations = getNameVariations(playerName);
    let data = null;

    // Tenta cada variação até achar
    for (const nameVariant of variations) {
      console.log(`[AGENT] Tentando variação: ${nameVariant} com season=2025`);
      // Tentativa 1: Com season 2025
      data = await fetchStats(nameVariant, '2025');

      if (!data) {
        console.log(`[AGENT] Falha com season=2025. Tentando sem season...`);
        // Tentativa 2: Sem season (fallback)
        data = await fetchStats(nameVariant);
      }

      if (data) break;
    }

    if (!data) {
      // Fallback conforme solicitado: não inventar números, assumir temporada honesta
      return JSON.stringify({
        formattedSummary: 'Temporada honesta.',
        seasonUsed: 'N/A',
      });
    }

    console.log(`[AGENT] Resultado Tank01 encontrado.`);

    try {
      const player =
        data.body && Array.isArray(data.body) && data.body.length > 0 ? data.body[0] : data;

      if (player) {
        const getNumber = (val: any) => {
          if (val === null || val === undefined) return 0;
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        };

        // O objeto stats agora vem aninhado por categoria (Rushing, Passing, etc)
        const statsObj = player.stats || {};

        // Categorias
        const passing = statsObj.Passing || {};
        const rushing = statsObj.Rushing || {};
        const receiving = statsObj.Receiving || {};
        const defense = statsObj.Defense || {};

        // Extração segura - Ofensiva
        const passingYards = getNumber(passing.passYds);
        const passingTD = getNumber(passing.passTD);

        const rushingYards = getNumber(rushing.rushYds);
        const rushingTD = getNumber(rushing.rushTD);

        const receivingYards = getNumber(receiving.recYds);
        const receivingTD = getNumber(receiving.recTD);

        // Extração segura - Defensiva (IDP)
        const tackles = getNumber(defense.totalTackles);
        const sacks = getNumber(defense.sacks);
        const interceptions = getNumber(defense.defensiveInterceptions);

        // Totais
        const totalOffensiveYards = passingYards + rushingYards + receivingYards;
        const totalOffensiveTDs = passingTD + rushingTD + receivingTD;
        const totalDefensiveStats = tackles + sacks + interceptions;

        let formattedSummary = '';

        // Lógica de Fallback Inteligente
        if (totalOffensiveYards === 0 && totalOffensiveTDs === 0 && totalDefensiveStats === 0) {
          formattedSummary = 'Temporada honesta.';
        } else {
          // Prioriza stats defensivos se forem relevantes (ex: mais tackles que jardas ofensivas)
          if (totalDefensiveStats > 0 && totalOffensiveYards < 20) {
            formattedSummary = `${tackles} Tackles, ${sacks} Sacks, ${interceptions} Interceptações`;
          } else {
            // Ofensivo
            if (passingYards > 0) {
              const totalYards = passingYards + rushingYards;
              formattedSummary = `${totalYards} Jardas Totais (Pass: ${passingYards}, Rush: ${rushingYards}) e ${totalOffensiveTDs} TDs Totais`;
            } else {
              const totalYards = rushingYards + receivingYards;
              formattedSummary = `${totalYards} Jardas de Scrimmage (Rush: ${rushingYards}, Rec: ${receivingYards}) e ${totalOffensiveTDs} TDs Totais`;
            }
          }
        }

        // Adiciona ao retorno
        data.formattedSummary = formattedSummary;
        data.seasonUsed = 'Recente (API)';
        data.identifier = generateUserIdentifier(player.longName || playerName);
      }
    } catch (e) {
      console.error('[AGENT] Erro ao processar stats:', e);
    }

    return JSON.stringify(data);
  } catch (error) {
    console.error('Erro ao buscar stats externos:', error);
    return JSON.stringify({ error: 'Erro ao conectar com API de estatísticas.' });
  }
}

// Helper to sanitize text for WinAnsi (StandardFonts)
const sanitizeText = (text: string) => {
  // Remove emojis and other non-supported characters (keep Latin-1 range)
  return text.replace(/[^\x00-\xFF]/g, '');
};

// Helper function to generate PDF
async function generateContractPdf(
  playerName: string,
  teamName: string,
  salary: string,
  duration: string,
  summary: string,
  fullHistory: string,
) {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    const checkPageBreak = (neededSpace: number) => {
      if (yPosition - neededSpace < 50) {
        page = pdfDoc.addPage();
        yPosition = height - 50;
      }
    };

    const drawText = (
      text: string,
      size: number,
      font = timesRomanFont,
      align: 'left' | 'center' | 'right' = 'left',
    ) => {
      const cleanText = sanitizeText(text);
      checkPageBreak(size + 10);
      const textWidth = font.widthOfTextAtSize(cleanText, size);
      let xPosition = 50;

      if (align === 'center') xPosition = (width - textWidth) / 2;
      if (align === 'right') xPosition = width - 50 - textWidth;

      page.drawText(cleanText, {
        x: xPosition,
        y: yPosition,
        size: size,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= size + 10;
    };

    const drawWrappedText = (text: string, size: number, font: PDFFont) => {
      const cleanText = sanitizeText(text);
      const maxWidth = width - 100;
      const paragraphs = cleanText.split('\n');

      for (const paragraph of paragraphs) {
        // Handle empty lines (newlines)
        if (!paragraph.trim()) {
          checkPageBreak(size);
          yPosition -= size;
          continue;
        }

        const words = paragraph.split(' ');
        let line = '';

        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = font.widthOfTextAtSize(testLine, size);

          if (testWidth > maxWidth) {
            // Draw current line
            checkPageBreak(size + 5);
            page.drawText(line, {
              x: 50,
              y: yPosition,
              size: size,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= size + 5;
            // Start new line with current word
            line = word + ' ';
          } else {
            line = testLine;
          }
        }
        // Draw remaining line of the paragraph
        if (line.trim()) {
          checkPageBreak(size + 5);
          page.drawText(line, {
            x: 50,
            y: yPosition,
            size: size,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= size + 5;
        }
      }
    };

    // Title
    drawText('CONTRATO DE JOGADOR - FANTASY LEAGUE', 20, timesRomanBold, 'center');
    yPosition -= 20;

    // Date
    drawText(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 12, timesRomanFont, 'right');
    yPosition -= 30;

    // Parties
    drawText('PARTES ENVOLVIDAS', 14, timesRomanBold);
    drawText(`JOGADOR: ${playerName}`, 12);
    drawText(`TIME/REPRESENTANTE: ${teamName}`, 12);
    drawText(`AGENTE: Jordan Spencer (Apex Dynasty Management)`, 12);
    yPosition -= 30;

    // Terms
    drawText('TERMOS DO ACORDO', 14, timesRomanBold);
    drawText(`SALÁRIO ANUAL: ${salary}`, 12);
    drawText(`DURAÇÃO: ${duration}`, 12);
    yPosition -= 30;

    // Signatures
    drawText('ASSINATURAS', 14, timesRomanBold);
    yPosition -= 30;
    drawText('_______________________________', 12);
    drawText(`${playerName} (Assinatura Digital)`, 12);
    yPosition -= 30;
    drawText('_______________________________', 12);
    drawText(`${teamName} (Assinatura Digital)`, 12);
    yPosition -= 50;

    // History
    drawText('HISTÓRICO COMPLETO DA NEGOCIAÇÃO', 14, timesRomanBold);
    drawWrappedText(fullHistory, 10, timesRomanFont);

    const pdfBytes = await pdfDoc.save();
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return `[📄 Baixar Contrato Assinado](data:application/pdf;base64,${base64})`;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return 'Erro ao gerar o contrato PDF.';
  }
}

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { messages } = await req.json();

    // Add system prompt if it's the start of conversation or ensure it's there
    const messagesWithSystem = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    // First call to OpenAI to decide if tools are needed
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      tools: tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;

    // If there are tool calls, execute them
    if (responseMessage.tool_calls) {
      // Append the assistant's message with tool calls to history
      messagesWithSystem.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResult = '';

        if (functionName === 'get_player_data_internal') {
          functionResult = await getPlayerDataInternal(functionArgs.playerName);
        } else if (functionName === 'get_player_stats_external') {
          functionResult = await getPlayerStatsExternal(functionArgs.playerName);
        } else if (functionName === 'generate_contract_pdf') {
          // Format full history for the PDF
          const fullHistory = messages
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .map((m: any) => `${m.role === 'user' ? 'Usuário' : 'Jordan Spencer'}: ${m.content}`)
            .join('\n\n');

          functionResult = await generateContractPdf(
            functionArgs.playerName,
            functionArgs.teamName,
            functionArgs.salary,
            functionArgs.duration,
            functionArgs.summary,
            fullHistory,
          );
        }

        // Append the tool result to history
        messagesWithSystem.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResult,
        });
      }

      // Second call to OpenAI with the tool results
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesWithSystem,
      });

      return NextResponse.json(finalResponse.choices[0].message);
    }

    // If no tool calls, just return the response
    return NextResponse.json(responseMessage);
  } catch (error) {
    console.error('Erro na rota do agente:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
