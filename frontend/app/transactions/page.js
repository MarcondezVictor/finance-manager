'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, Button, Modal, Form, Spinner, Badge, Alert } from 'react-bootstrap';
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getAccounts, getTags, createTag,
} from '@/lib/strapi';
import { formatCurrency } from '@/lib/finance';
import { useAuth } from '@/context/AuthContext';

const EMPTY_FORM = {
  description: '', amount: '', date: '', type: 'expense', account: '', tags: [],
};

export default function TransactionsPage() {
  const { user, ready } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal / form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // documentId being edited, or null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [newTag, setNewTag] = useState('');

  // Loads transactions + accounts + tags in parallel
  async function loadData() {
    try {
      setLoading(true);
      const [t, a, tg] = await Promise.all([getTransactions(), getAccounts(), getTags()]);
      setTransactions(t); setAccounts(a); setTags(tg);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;                         // still checking the session
    if (!user) { setLoading(false); return; }   // not signed in, nothing to load
    loadData();
  }, [ready, user]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewTag('');
    setShowModal(true);
  }

  function openEdit(transaction) {
    setEditingId(transaction.documentId);
    setForm({
      description: transaction.description || '',
      amount: transaction.amount ?? '',
      date: transaction.date || '',
      type: transaction.type || 'expense',
      account: transaction.account?.documentId || '',
      tags: (transaction.tags || []).map((t) => t.documentId),
    });
    setNewTag('');
    setShowModal(true);
  }

  // Creates the tag via the API, adds it to the list and selects it in the form
  async function handleCreateTag() {
    const name = newTag.trim();
    if (!name) return;
    try {
      const tag = await createTag(name);
      setTags((current) => [...current, tag]);
      setForm((f) => ({ ...f, tags: [...f.tags, tag.documentId] }));
      setNewTag('');
    } catch (err) {
      setError(err.message);
    }
  }

  // Save: either create or update
  async function handleSave(e) {
    e.preventDefault();
    try {
      const data = {
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        type: form.type,
        account: form.account || null, // one-to-many relation (account documentId)
        tags: form.tags,               // many-to-many relation (array of documentIds)
      };
      if (editingId) await updateTransaction(editingId, data);
      else await createTransaction(data);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(documentId) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(documentId);
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
        You need to sign in to see your transactions.{' '}
        <Link href="/login">Sign in</Link>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Transactions</h2>
        <Button onClick={openCreate}>+ New transaction</Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Description</th><th>Amount</th><th>Date</th><th>Type</th>
            <th>Account</th><th>Tags</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && (
            <tr><td colSpan={7} className="text-center">No transactions yet.</td></tr>
          )}
          {transactions.map((t) => (
            <tr key={t.documentId}>
              <td>{t.description}</td>
              <td>{formatCurrency(t.amount)}</td>
              <td>{t.date}</td>
              <td>
                <Badge bg={t.type === 'income' ? 'success' : 'danger'}>
                  {t.type === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </td>
              <td>{t.account?.name || '—'}</td>
              <td>
                {(t.tags || []).map((tag) => (
                  <Badge bg="secondary" className="me-1" key={tag.documentId}>{tag.name}</Badge>
                ))}
              </td>
              <td>
                <Button size="sm" variant="outline-primary" className="me-2"
                  onClick={() => openEdit(t)}>Edit</Button>
                <Button size="sm" variant="outline-danger"
                  onClick={() => handleDelete(t.documentId)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* MODAL: used for both CREATE and EDIT */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>{editingId ? 'Edit transaction' : 'New transaction'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control value={form.description} required
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount (€)</Form.Label>
              <Form.Control type="number" step="0.01" value={form.amount} required
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={form.date} required
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account</Form.Label>
              <Form.Select value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}>
                <option value="">— select —</option>
                {accounts.map((a) => (
                  <option key={a.documentId} value={a.documentId}>{a.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags (Ctrl+click to select several)</Form.Label>
              <Form.Select multiple value={form.tags}
                onChange={(e) => setForm({
                  ...form,
                  tags: Array.from(e.target.selectedOptions, (o) => o.value),
                })}>
                {tags.map((tag) => (
                  <option key={tag.documentId} value={tag.documentId}>{tag.name}</option>
                ))}
              </Form.Select>
              <div className="d-flex gap-2 mt-2">
                <Form.Control
                  size="sm"
                  placeholder="New tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline-secondary"
                  className="text-nowrap"
                  disabled={!newTag.trim()}
                  onClick={handleCreateTag}
                >
                  + Add tag
                </Button>
              </div>
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
