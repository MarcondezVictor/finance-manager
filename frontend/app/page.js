'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { getAccounts, getTransactions } from '@/lib/strapi';
import {
  accountSummary, formatCurrency, totalsByType, totalsByMonth, expensesByAccount,
} from '@/lib/finance';
import { useAuth } from '@/context/AuthContext';
import KpiCard from '@/components/dashboard/KpiCard';
import IncomeExpenseChart from '@/components/dashboard/IncomeExpenseChart';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import ExpensesByAccountChart from '@/components/dashboard/ExpensesByAccountChart';

export default function Dashboard() {
  const { user, ready } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      try {
        setLoading(true);
        const [a, t] = await Promise.all([getAccounts(), getTransactions()]);
        setAccounts(a); setTransactions(t);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, user]);

  if (!ready || loading) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }

  if (!user) {
    return (
      <Alert variant="warning">
        You need to sign in to see your dashboard.{' '}
        <Link href="/login">Sign in</Link>
      </Alert>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-5">
        <h2>Welcome to Finance Manager</h2>
        <p className="text-muted">You don&apos;t have any transactions yet.</p>
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Link href="/accounts" className="btn btn-outline-primary">Manage accounts</Link>
          <Link href="/transactions" className="btn btn-primary">Add a transaction</Link>
        </div>
      </div>
    );
  }

  const totalInitialBalance = accounts.reduce((sum, a) => sum + (Number(a.initialBalance) || 0), 0);
  const netWorth = accounts.reduce(
    (sum, a) => sum + accountSummary(a, transactions).currentBalance, 0
  );

  const byType = totalsByType(transactions);
  const byMonth = totalsByMonth(transactions, totalInitialBalance);
  const byAccount = expensesByAccount(accounts, transactions);

  const totalIncome = byType.find((d) => d.type === 'Income')?.total || 0;
  const totalExpenses = byType.find((d) => d.type === 'Expenses')?.total || 0;

  // Current month built from local date parts (not toISOString) so it can't jump
  // to another month because of the time zone near midnight.
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonth = byMonth.find((m) => m.month === currentMonthKey);
  const currentMonthBalance = currentMonth ? currentMonth.income - currentMonth.expenses : 0;

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>

      <Row xs={1} md={2} lg={4} className="g-3 mb-4">
        <Col>
          <KpiCard title="Net worth" value={formatCurrency(netWorth)} />
        </Col>
        <Col>
          <KpiCard title="Total income" value={formatCurrency(totalIncome)} textColor="text-success" />
        </Col>
        <Col>
          <KpiCard title="Total expenses" value={formatCurrency(totalExpenses)} textColor="text-danger" />
        </Col>
        <Col>
          <KpiCard
            title="This month"
            value={formatCurrency(currentMonthBalance)}
            textColor={currentMonthBalance >= 0 ? 'text-success' : 'text-danger'}
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Income vs. expenses</Card.Title>
              <IncomeExpenseChart data={byType} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Expenses by account</Card.Title>
              <ExpensesByAccountChart data={byAccount} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="h6">Monthly trend</Card.Title>
              <MonthlyTrendChart data={byMonth} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
