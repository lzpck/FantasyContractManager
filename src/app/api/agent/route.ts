import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb, PDFFont, degrees } from 'pdf-lib';
import { generateUserIdentifier, getNameVariations } from '@/utils/identifierUtils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

REGRA #1: USO DA FRANCHISE TAG E VALOR DE MERCADO:
- Use o valor \`franchiseTagValue\` retornado pela ferramenta como sua "âncora".
- Se a oferta for MENOR que a Tag, use isso como insulto: "A Tag da posição é $15M. Por que eu aceitaria menos?"
- Se a oferta for MAIOR que a Tag (OVERPAY), ACEITE IMEDIATAMENTE com entusiasmo. NÃO negocie para baixar o valor. Seu dever é maximizar o lucro do cliente.
- Exemplo de Overpay: Se a Tag é $12M e oferecem $15M -> "Uau, $15M é uma oferta que respeita o talento dele. Aceitamos!"
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
3. CONTEXTO DO USUÁRIO: O usuário representa o time "{{USER_TEAM_NAME}}". Use esse nome exato no contrato.
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

// Cache em memória para evitar rate limit da Tank01
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

// Helper function to get external player stats
async function getPlayerStatsExternal(playerName: string) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return JSON.stringify({ error: 'RAPIDAPI_KEY não configurada.' });
  }

  const fetchStats = async (name: string) => {
    const url = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLPlayerInfo?playerName=${encodeURIComponent(
      name,
    )}&getStats=true`;

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

    // 1. Verifica Cache
    for (const variant of variations) {
      const cached = statsCache.get(variant);
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < CACHE_TTL) {
          console.log(`[AGENT] Cache HIT para: ${variant}`);
          return JSON.stringify(cached.data);
        } else {
          statsCache.delete(variant);
        }
      }
    }

    // 2. Busca na API se não achar no cache
    for (const nameVariant of variations) {
      console.log(`[AGENT] Tentando variação: ${nameVariant}`);
      data = await fetchStats(nameVariant);

      if (data) {
        statsCache.set(nameVariant, { data, timestamp: Date.now() });
        break;
      }
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
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let yPosition = height - margin;

    // Helper to draw border
    const drawBorder = () => {
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0, 0, 0),
        borderWidth: 2,
      });
    };
    drawBorder();

    const checkPageBreak = (neededSpace: number) => {
      if (yPosition - neededSpace < margin) {
        page = pdfDoc.addPage();
        drawBorder();
        yPosition = height - margin;
      }
    };

    const drawText = (
      text: string,
      size: number,
      font = timesRomanFont,
      align: 'left' | 'center' | 'right' = 'left',
      color = rgb(0, 0, 0),
    ) => {
      const cleanText = sanitizeText(text);
      checkPageBreak(size + 10);
      const textWidth = font.widthOfTextAtSize(cleanText, size);
      let xPosition = margin;

      if (align === 'center') xPosition = (width - textWidth) / 2;
      if (align === 'right') xPosition = width - margin - textWidth;

      page.drawText(cleanText, {
        x: xPosition,
        y: yPosition,
        size: size,
        font: font,
        color: color,
      });
      yPosition -= size + 8;
    };

    const drawLine = () => {
      checkPageBreak(10);
      page.drawLine({
        start: { x: margin, y: yPosition + 5 },
        end: { x: width - margin, y: yPosition + 5 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      yPosition -= 15;
    };

    const drawWrappedText = (text: string, size: number, font: PDFFont, lineHeight = 1.2) => {
      const cleanText = sanitizeText(text);
      const maxWidth = width - margin * 2;
      const paragraphs = cleanText.split('\n');

      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          yPosition -= size * 0.5; // Smaller gap for empty lines
          continue;
        }

        const words = paragraph.split(' ');
        let line = '';

        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = font.widthOfTextAtSize(testLine, size);

          if (testWidth > maxWidth) {
            checkPageBreak(size * lineHeight);
            page.drawText(line, {
              x: margin,
              y: yPosition,
              size: size,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= size * lineHeight;
            line = word + ' ';
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          checkPageBreak(size * lineHeight);
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: size,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= size * lineHeight;
        }
      }
    };

    // --- HEADER ---
    drawText('CONTRATO OFICIAL DE JOGADOR', 24, helveticaBold, 'center');
    drawText('FANTASY FOOTBALL LEAGUE', 14, timesRomanFont, 'center', rgb(0.4, 0.4, 0.4));
    yPosition -= 20;
    drawLine();

    // --- PARTIES ---
    drawText('1. PARTES CONTRATANTES', 14, timesRomanBold);
    yPosition -= 5;
    drawText(`CONTRATANTE (TIME): ${teamName}`, 12);
    drawText(`CONTRATADO (JOGADOR): ${playerName}`, 12);
    drawText(`REPRESENTANTE: Jordan Spencer (Apex Dynasty Management)`, 12);
    yPosition -= 15;

    // --- TERMS ---
    drawText('2. TERMOS DO ACORDO', 14, timesRomanBold);
    yPosition -= 5;

    // Box for terms
    const boxHeight = 60;
    page.drawRectangle({
      x: margin,
      y: yPosition - boxHeight + 12,
      width: width - margin * 2,
      height: boxHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.97, 0.97, 0.97),
    });

    yPosition -= 15;
    drawText(`   SALÁRIO POR TEMPORADA: ${salary}`, 12, timesRomanBold);
    drawText(`   DURAÇÃO DO VÍNCULO: ${duration}`, 12, timesRomanBold);
    yPosition -= 30;

    // --- LEGAL CLAUSE ---
    drawText('3. CLÁUSULAS GERAIS', 14, timesRomanBold);
    yPosition -= 5;
    const legalText = `Este acordo formaliza o vínculo entre as partes acima citadas para a disputa da liga de Fantasy Football. O jogador compromete-se a desempenhar suas funções atléticas com total dedicação, enquanto o time compromete-se a honrar os pagamentos virtuais estipulados. Este contrato substitui quaisquer acordos verbais anteriores e é irrevogável até o fim de sua vigência, salvo cláusulas de rescisão previstas no regulamento da liga.`;
    drawWrappedText(legalText, 10, timesRomanFont);
    yPosition -= 20;

    // --- SIGNATURES ---
    checkPageBreak(150);
    drawText('4. ASSINATURAS', 14, timesRomanBold);
    yPosition -= 40;

    const sigLineY = yPosition;

    // Team Signature
    page.drawLine({
      start: { x: margin, y: sigLineY },
      end: { x: margin + 200, y: sigLineY },
      thickness: 1,
    });
    page.drawText(`${teamName}`, { x: margin, y: sigLineY - 15, size: 10, font: timesRomanFont });
    page.drawText(`(Representante do Time)`, {
      x: margin,
      y: sigLineY - 25,
      size: 8,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Player Signature
    page.drawLine({
      start: { x: width - margin - 200, y: sigLineY },
      end: { x: width - margin, y: sigLineY },
      thickness: 1,
    });
    // Simulated signature font for player
    page.drawText(`${playerName}`, {
      x: width - margin - 180,
      y: sigLineY + 5,
      size: 16,
      font: timesRomanFont,
      rotate: degrees(-5),
      color: rgb(0, 0, 0.5),
    });
    page.drawText(`${playerName}`, {
      x: width - margin - 200,
      y: sigLineY - 15,
      size: 10,
      font: timesRomanFont,
    });
    page.drawText(`(Atleta Profissional)`, {
      x: width - margin - 200,
      y: sigLineY - 25,
      size: 8,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    yPosition -= 60;

    // Date
    drawText(
      `Firmado em: ${new Date().toLocaleDateString('pt-BR')}`,
      10,
      timesRomanFont,
      'center',
      rgb(0.5, 0.5, 0.5),
    );
    yPosition -= 30;
    drawLine();

    // --- HISTORY ---
    page = pdfDoc.addPage();
    drawBorder();
    yPosition = height - margin;

    drawText('ANEXO: HISTÓRICO DA NEGOCIAÇÃO', 12, timesRomanBold, 'left', rgb(0.3, 0.3, 0.3));
    yPosition -= 10;
    // Compact history
    drawWrappedText(fullHistory, 9, timesRomanFont, 1.1);

    const pdfBytes = await pdfDoc.save();
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return `[📄 Baixar Contrato Oficial (${playerName})](data:application/pdf;base64,${base64})`;
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

    // Fetch user team for context
    const session = await getServerSession(authOptions);
    let userTeamName = 'Time do Usuário';

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        let team = null;

        // Prioridade 1: Buscar pelo teamId associado no perfil do usuário
        if (user.teamId) {
          team = await prisma.team.findUnique({
            where: { id: user.teamId },
            include: { league: true },
          });
        }

        // Prioridade 2: Buscar pelo ownerId (times que o usuário possui)
        if (!team) {
          team = await prisma.team.findFirst({
            where: { ownerId: user.id, league: { status: 'ACTIVE' } },
          });
        }

        if (team) {
          userTeamName = team.name;
        }
      }
    }

    // Inject Team Name into System Prompt
    const dynamicSystemPrompt = SYSTEM_PROMPT.replace('{{USER_TEAM_NAME}}', userTeamName);

    // Add system prompt if it's the start of conversation or ensure it's there
    const messagesWithSystem = [{ role: 'system', content: dynamicSystemPrompt }, ...messages];

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
            .join('\n'); // Single line break for compactness

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
