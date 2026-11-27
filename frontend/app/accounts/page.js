'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Row, Col, Card, Badge, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import {
  getAccounts, getTransactions, createAccount, updateAccount, deleteAccount,
} from '@/lib/strapi';
import { accountSummary, formatCurrency, ACCOUNT_TYPES } from '@/lib/finance';
import { useAuth } from '@/context/AuthContext';

const EMPTY_FORM = { name: '', type: 'bank', initialBalance: '' };

export default function AccountsPage() {
  const { user, ready } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // documentId being edited, or null = create
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadData() {
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
  }

  useEffect(() => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }
    loadData();
  }, [ready, user]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(account) {
    setEditingId(account.documentId);
    setForm({
      name: account.name || '',
      type: account.type || 'bank',
      initialBalance: account.initialBalance ?? '',
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const data = {
        name: form.name,
        type: form.type,
        initialBalance: parseFloat(form.initialBalance) || 0,
      };
      if (editingId) await updateAccount(editingId, data);
      else await createAccount(data);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(documentId) {
    if (!confirm('Delete this account?')) return;
    try {
      await deleteAccount(documentId);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!ready || loading) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }
  if (!user) {
    return (
      <Alert variant="warning">
        You need to sign in to see your accounts.{' '}
        <Link href="/login">Sign in</Link>
      </Alert>
    );
  }

  const netWorth = accounts.reduce(
    (total, account) => total + accountSummary(account, transactions).currentBalance, 0
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My accounts</h2>
        <Button onClick={openCreate}>+ New account</Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Card bg="dark" text="white" className="mb-4 shadow-sm">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <div className="text-uppercase small opacity-75">Net worth</div>
            <h3 className="mb-0">{formatCurrency(netWorth)}</h3>
          </div>
          <div className="text-end small opacity-75">
            {accounts.length} account(s) · {transactions.length} transaction(s)
          </div>
        </Card.Body>
      </Card>

      {accounts.length === 0 && (
        <p className="text-muted">You don&apos;t have any accounts yet. Create one with &quot;+ New account&quot;.</p>
      )}

      <Row xs={1} md={2} lg={3} className="g-3">
        {accounts.map((account) => {
          const s = accountSummary(account, transactions);
          return (
            <Col key={account.documentId}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>{account.name}</strong>
                  <Badge bg="info" className="text-uppercase">
                    {ACCOUNT_TYPES[account.type] || account.type}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <div className="text-muted small">Current balance</div>
                  <h3 className={s.currentBalance >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(s.currentBalance)}
                  </h3>
                  <hr />
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Initial balance</span>
                    <span>{formatCurrency(s.initialBalance)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Income</span>
                    <span className="text-success">+ {formatCurrency(s.totalIncome)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Expenses</span>
                    <span className="text-danger">− {formatCurrency(s.totalExpenses)}</span>
                  </div>
                  <div className="d-flex justify-content-between small mt-2">
                    <span className="text-muted">Transactions</span>
                    <span>{s.transactionCount}</span>
                  </div>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-end gap-2">
                  <Button size="sm" variant="outline-primary"
                    onClick={() => openEdit(account)}>Edit</Button>
                  <Button size="sm" variant="outline-danger"
                    onClick={() => handleDelete(account.documentId)}>Delete</Button>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>{editingId ? 'Edit account' : 'New account'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} required
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Initial balance (€)</Form.Label>
              <Form.Control type="number" step="0.01" value={form.initialBalance}
                onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
