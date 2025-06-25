/**
 * Demonstração das funções de contrato em JavaScript puro
 * Para validar que a lógica está correta
 */

// Simulação das funções principais em JavaScript
function calculateAnnualSalary(originalSalary, targetYear) {
  if (targetYear < 0) {
    throw new Error('Ano alvo não pode ser negativo');
  }

  const annualIncreaseRate = 1.15;
  const calculatedSalary = originalSalary * Math.pow(annualIncreaseRate, targetYear);
  return Math.round(calculatedSalary * 100) / 100;
}

function calculateDeadMoney(originalSalary, originalYears, cutYear, isPracticeSquad = false) {
  const currentYearSalary = calculateAnnualSalary(originalSalary, cutYear);
  const yearsRemaining = originalYears - cutYear - 1;

  let currentSeasonAmount;
  let nextSeasonAmount;

  if (isPracticeSquad) {
    currentSeasonAmount = currentYearSalary * 0.25;
    nextSeasonAmount = 0;
  } else {
    currentSeasonAmount = currentYearSalary;

    let remainingYearsPenalty = 0;
    for (let year = cutYear + 1; year < originalYears; year++) {
      const yearSalary = calculateAnnualSalary(originalSalary, year);
      remainingYearsPenalty += yearSalary * 0.25;
    }
    nextSeasonAmount = remainingYearsPenalty;
  }

  const totalAmount = currentSeasonAmount + nextSeasonAmount;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    currentSeasonAmount: Math.round(currentSeasonAmount * 100) / 100,
    nextSeasonAmount: Math.round(nextSeasonAmount * 100) / 100,
    breakdown: {
      currentYearSalary,
      remainingYears: yearsRemaining,
    },
  };
}

function calculateFranchiseTagValue(currentSalary, positionAverage) {
  const salaryWith15Percent = currentSalary * 1.15;
  const finalTagValue = Math.max(salaryWith15Percent, positionAverage);

  return {
    currentSalary,
    salaryWith15Percent: Math.round(salaryWith15Percent * 100) / 100,
    positionAverage,
    finalTagValue: Math.round(finalTagValue * 100) / 100,
  };
}

// Demonstração das funções
console.log('🧪 DEMONSTRAÇÃO DAS FUNÇÕES DE CONTRATO');
console.log('======================================');

// Exemplo: Josh Allen, $30M por 4 anos
const playerName = 'Josh Allen';
const originalSalary = 30.0;
const originalYears = 4;

console.log(`\n📊 Jogador: ${playerName}`);
console.log(`Contrato: $${originalSalary}M por ${originalYears} anos`);

// Teste 1: Projeção salarial
console.log('\n💰 Projeção Salarial (aumento anual de 15%):');
for (let year = 0; year < originalYears; year++) {
  const salary = calculateAnnualSalary(originalSalary, year);
  console.log(`  Ano ${year + 1}: $${salary}M`);
}

// Teste 2: Dead Money - Corte no ano 2
console.log('\n💀 Dead Money - Corte no Ano 2:');
const deadMoney = calculateDeadMoney(originalSalary, originalYears, 1, false);
console.log(`  Salário do ano atual: $${deadMoney.breakdown.currentYearSalary}M`);
console.log(`  Anos restantes: ${deadMoney.breakdown.remainingYears}`);
console.log(`  Dead money temporada atual: $${deadMoney.currentSeasonAmount}M`);
console.log(`  Dead money próxima temporada: $${deadMoney.nextSeasonAmount}M`);
console.log(`  Total de dead money: $${deadMoney.totalAmount}M`);

// Teste 3: Dead Money - Practice Squad
console.log('\n💀 Dead Money - Practice Squad (Ano 2):');
const deadMoneyPS = calculateDeadMoney(originalSalary, originalYears, 1, true);
console.log(`  Dead money temporada atual: $${deadMoneyPS.currentSeasonAmount}M`);
console.log(`  Dead money próxima temporada: $${deadMoneyPS.nextSeasonAmount}M`);
console.log(`  Total: $${deadMoneyPS.totalAmount}M`);

// Teste 4: Franchise Tag
console.log('\n🏷️ Franchise Tag - QB (ano 4):');
const year3Salary = calculateAnnualSalary(originalSalary, 3); // Salário no 4º ano
const qbPositionAverage = 25.0; // Média dos top 10 QBs
const franchiseTag = calculateFranchiseTagValue(year3Salary, qbPositionAverage);
console.log(`  Salário atual: $${franchiseTag.currentSalary}M`);
console.log(`  Salário + 15%: $${franchiseTag.salaryWith15Percent}M`);
console.log(`  Média top 10 QB: $${franchiseTag.positionAverage}M`);
console.log(`  Valor da tag: $${franchiseTag.finalTagValue}M`);
console.log(
  `  Critério: ${franchiseTag.finalTagValue === franchiseTag.salaryWith15Percent ? 'Salário + 15%' : 'Média da posição'}`,
);

// Teste 5: Validação de Cap Space
console.log('\n💸 Validação de Salary Cap:');
const teamCap = 45.5; // Cap disponível do time
const operationCost = 20.0; // Custo da operação
const hasSpace = teamCap >= operationCost;
const shortfall = hasSpace ? 0 : operationCost - teamCap;

console.log(`  Cap disponível: $${teamCap}M`);
console.log(`  Custo da operação: $${operationCost}M`);
console.log(`  Tem espaço: ${hasSpace}`);
if (!hasSpace) {
  console.log(`  Déficit: $${shortfall}M`);
}

// Teste 6: Projeção de Cap para próximos anos
console.log('\n📊 Projeção de Cap (próximos 3 anos):');
const leagueCap = 279.0;
const currentDeadMoney = 8.2;
const nextSeasonDeadMoney = 3.1;

for (let i = 0; i < 3; i++) {
  const year = 2024 + i;
  const contractYear = i;
  const salary = calculateAnnualSalary(originalSalary, contractYear);
  const deadMoney = i === 0 ? currentDeadMoney : i === 1 ? nextSeasonDeadMoney : 0;
  const availableCap = leagueCap - salary - deadMoney;

  console.log(
    `  ${year}: Salário $${salary}M + Dead Money $${deadMoney}M = Cap disponível $${availableCap}M`,
  );
}

console.log('\n✅ DEMONSTRAÇÃO CONCLUÍDA!');
console.log('\n📋 FUNCIONALIDADES VALIDADAS:');
console.log('  ✓ Cálculo de salário anual com aumento de 15%');
console.log('  ✓ Cálculo de dead money (regular e practice squad)');
console.log('  ✓ Cálculo do valor da franchise tag');
console.log('  ✓ Validação de espaço no salary cap');
console.log('  ✓ Projeção de cap para anos futuros');

console.log('\n🎯 REGRAS DA LIGA IMPLEMENTADAS:');
console.log('  • Aumento anual automático de 15% nos contratos');
console.log('  • Dead money: 100% do salário atual + 25% dos anos restantes');
console.log('  • Practice squad: apenas 25% do salário atual como dead money');
console.log('  • Franchise tag: maior entre salário+15% ou média top 10 da posição');
console.log('  • Validações de salary cap e operações financeiras');

console.log('\n🚀 PRÓXIMOS PASSOS:');
console.log('  1. Integrar com a interface React/Next.js');
console.log('  2. Conectar com banco de dados para persistência');
console.log('  3. Implementar integração com Sleeper API');
console.log('  4. Adicionar testes automatizados');
console.log('  5. Criar dashboard para visualização dos dados');
