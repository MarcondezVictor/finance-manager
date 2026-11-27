// Business logic for the finance manager, kept apart from the UI and the API.
// (Pure functions: data in, result out, no side effects.)

// Formats a number as euros, e.g. 1234.5 -> "€1,234.50"
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0);
}

// Formats a "YYYY-MM" key as a short month label, e.g. "2026-08" -> "Aug 2026"
export function formatMonth(key) {
  const [year, month] = String(key).split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Human-readable labels for the account types stored in Strapi
export const ACCOUNT_TYPES = {
  bank: 'Bank',
  digital_wallet: 'Digital wallet',
  card: 'Card',
  cash: 'Cash',
  investment: 'Investment',
};

const sumAmounts = (transactions, type) =>
  transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

// Summary of ONE account, computed from the list of ALL transactions.
// The balance is never stored: it's always derived from the initial balance + transactions.
export function accountSummary(account, allTransactions) {
  const transactions = (allTransactions || []).filter(
    (t) => t.account?.documentId === account.documentId
  );

  const totalIncome = sumAmounts(transactions, 'income');
  const totalExpenses = sumAmounts(transactions, 'expense');
  const initialBalance = Number(account.initialBalance) || 0;

  return {
    initialBalance,
    totalIncome,
    totalExpenses,
    currentBalance: initialBalance + totalIncome - totalExpenses,
    transactionCount: transactions.length,
  };
}

// Total income vs. total expenses, in the shape Recharts expects ([{ type, total }]).
export function totalsByType(transactions) {
  return [
    { type: 'Income', total: sumAmounts(transactions || [], 'income') },
    { type: 'Expenses', total: sumAmounts(transactions || [], 'expense') },
  ];
}

// Groups transactions by month ("YYYY-MM") in chronological order, with the running
// balance (total initial balance + cumulative income − expenses, month by month).
//
// We use t.date.slice(0, 7) on purpose instead of `new Date(t.date)`: Strapi stores the
// date as "YYYY-MM-DD" text, and converting to a Date can shift it into another month
// because of the local time zone. Slicing the string avoids that.
export function totalsByMonth(transactions, totalInitialBalance = 0) {
  const byMonth = {};

  (transactions || []).forEach((t) => {
    if (!t.date) return;
    const month = String(t.date).slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 };

    if (t.type === 'income') byMonth[month].income += Number(t.amount) || 0;
    else if (t.type === 'expense') byMonth[month].expenses += Number(t.amount) || 0;
  });

  const months = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

  let runningBalance = totalInitialBalance;
  return months.map((m) => {
    runningBalance += m.income - m.expenses;
    return { ...m, balance: runningBalance };
  });
}

// How much was spent from each account, sorted from highest to lowest.
export function expensesByAccount(accounts, transactions) {
  return (accounts || [])
    .map((account) => ({
      name: account.name,
      total: sumAmounts(
        (transactions || []).filter((t) => t.account?.documentId === account.documentId),
        'expense'
      ),
    }))
    .sort((a, b) => b.total - a.total);
}
