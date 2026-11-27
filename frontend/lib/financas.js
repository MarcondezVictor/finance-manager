// Lógica de negócio do gestor de finanças, separada da UI e da API.
// (Funções "puras": recebem dados, devolvem um resultado, sem efeitos secundários.)

// Formata um número como moeda em euros, à portuguesa (ex.: 1234.5 -> "1 234,50 €")
export function formatarEuros(valor) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(valor) || 0);
}

// Calcula o resumo financeiro de UMA conta, a partir da lista de TODOS os movimentos.
// O saldo nunca é guardado: é sempre derivado do saldo inicial + soma dos movimentos.
export function resumoConta(conta, todosOsMovimentos) {
  // 1. Filtra só os movimentos desta conta (compara pelo documentId)
  const movimentos = (todosOsMovimentos || []).filter(
    (m) => m.conta?.documentId === conta.documentId
  );

  // 2. Soma receitas e despesas separadamente
  const totalReceitas = movimentos
    .filter((m) => m.tipo === 'receita')
    .reduce((soma, m) => soma + (Number(m.valor) || 0), 0);

  const totalDespesas = movimentos
    .filter((m) => m.tipo === 'despesa')
    .reduce((soma, m) => soma + (Number(m.valor) || 0), 0);

  // 3. Saldo atual = aporte inicial + receitas − despesas
  const saldoInicial = Number(conta.saldoInicial) || 0;
  const saldoAtual = saldoInicial + totalReceitas - totalDespesas;

  return {
    saldoInicial,
    totalReceitas,
    totalDespesas,
    saldoAtual,
    numMovimentos: movimentos.length,
  };
}

// Total de receitas vs total de despesas, já no formato que o Recharts espera
// (uma lista de { tipo, total }), para o gráfico de Receitas vs Despesas.
export function totaisPorTipo(movimentos) {
  const totalReceitas = (movimentos || [])
    .filter((m) => m.tipo === 'receita')
    .reduce((soma, m) => soma + (Number(m.valor) || 0), 0);

  const totalDespesas = (movimentos || [])
    .filter((m) => m.tipo === 'despesa')
    .reduce((soma, m) => soma + (Number(m.valor) || 0), 0);

  return [
    { tipo: 'Receitas', total: totalReceitas },
    { tipo: 'Despesas', total: totalDespesas },
  ];
}

// Agrupa os movimentos por mês (ano-mês, ex.: "2026-06") e devolve a evolução
// ordenada cronologicamente, com o saldo acumulado (saldoInicialTotal + soma
// progressiva de receitas−despesas mês a mês).
//
// Usamos m.data.slice(0, 7) em vez de `new Date(m.data)` de propósito: o Strapi
// guarda a data como texto "YYYY-MM-DD", e converter para Date/toISOString
// pode deslocar a data com o fuso horário local (ex.: passar para o mês
// seguinte perto da meia-noite). Cortar a string evita esse problema.
export function totaisPorMes(movimentos, saldoInicialTotal = 0) {
  const porMes = {};

  (movimentos || []).forEach((m) => {
    if (!m.data) return;
    const mes = String(m.data).slice(0, 7);
    if (!porMes[mes]) porMes[mes] = { mes, receitas: 0, despesas: 0 };

    if (m.tipo === 'receita') porMes[mes].receitas += Number(m.valor) || 0;
    else if (m.tipo === 'despesa') porMes[mes].despesas += Number(m.valor) || 0;
  });

  const meses = Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));

  let acumulado = saldoInicialTotal;
  return meses.map((m) => {
    acumulado += m.receitas - m.despesas;
    return { ...m, saldoAcumulado: acumulado };
  });
}

// Quanto foi gasto (despesas) em cada conta, ordenado da maior para a menor.
export function totaisPorConta(contas, movimentos) {
  return (contas || [])
    .map((conta) => {
      const total = (movimentos || [])
        .filter((m) => m.conta?.documentId === conta.documentId && m.tipo === 'despesa')
        .reduce((soma, m) => soma + (Number(m.valor) || 0), 0);
      return { nome: conta.nome, total };
    })
    .sort((a, b) => b.total - a.total);
}
