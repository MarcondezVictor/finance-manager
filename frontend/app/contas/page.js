// app/contas/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Row, Col, Card, Badge, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import {
  getContas, getMovimentos, criarConta, atualizarConta, apagarConta,
} from '@/lib/strapi';
import { resumoConta, formatarEuros } from '@/lib/financas';
import { useAuth } from '@/context/AuthContext';

const FORM_VAZIO = { nome: '', tipo: 'banco', saldoInicial: '' };

export default function ContasPage() {
  const { user, pronto } = useAuth();

  const [contas, setContas] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editarId, setEditarId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  async function carregarDados() {
    try {
      setACarregar(true);
      const [c, m] = await Promise.all([getContas(), getMovimentos()]);
      setContas(c); setMovimentos(m);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }

  useEffect(() => {
    if (!pronto) return;
    if (!user) { setACarregar(false); return; }
    carregarDados();
  }, [pronto, user]);

  function abrirCriar() {
    setEditarId(null);
    setForm(FORM_VAZIO);
    setMostrarModal(true);
  }

  function abrirEditar(conta) {
    setEditarId(conta.documentId);
    setForm({
      nome: conta.nome || '',
      tipo: conta.tipo || 'banco',
      saldoInicial: conta.saldoInicial ?? '',
    });
    setMostrarModal(true);
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      const dados = {
        nome: form.nome,
        tipo: form.tipo,
        saldoInicial: parseFloat(form.saldoInicial) || 0,
      };
      if (editarId) await atualizarConta(editarId, dados);
      else await criarConta(dados);
      setMostrarModal(false);
      await carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function remover(documentId) {
    if (!confirm('Apagar esta conta?')) return;
    try {
      await apagarConta(documentId);
      await carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!pronto || aCarregar) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }
  if (!user) {
    return (
      <Alert variant="warning">
        Precisas de iniciar sessão para ver as tuas contas.{' '}
        <Link href="/login">Entrar</Link>
      </Alert>
    );
  }

  const patrimonioTotal = contas.reduce(
    (total, conta) => total + resumoConta(conta, movimentos).saldoAtual, 0
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">As minhas contas</h2>
        <Button onClick={abrirCriar}>+ Nova Conta</Button>
      </div>

      {erro && <Alert variant="danger" dismissible onClose={() => setErro(null)}>{erro}</Alert>}

      <Card bg="dark" text="white" className="mb-4 shadow-sm">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <div className="text-uppercase small opacity-75">Património total</div>
            <h3 className="mb-0">{formatarEuros(patrimonioTotal)}</h3>
          </div>
          <div className="text-end small opacity-75">
            {contas.length} conta(s) · {movimentos.length} movimento(s)
          </div>
        </Card.Body>
      </Card>

      {contas.length === 0 && (
        <p className="text-muted">Ainda não tens contas. Cria a primeira em "+ Nova Conta".</p>
      )}

      <Row xs={1} md={2} lg={3} className="g-3">
        {contas.map((conta) => {
          const r = resumoConta(conta, movimentos);
          const positivo = r.saldoAtual >= 0;
          return (
            <Col key={conta.documentId}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>{conta.nome}</strong>
                  <Badge bg="info" className="text-uppercase">{conta.tipo}</Badge>
                </Card.Header>
                <Card.Body>
                  <div className="text-muted small">Saldo atual</div>
                  <h3 className={positivo ? 'text-success' : 'text-danger'}>
                    {formatarEuros(r.saldoAtual)}
                  </h3>
                  <hr />
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Saldo inicial (aporte)</span>
                    <span>{formatarEuros(r.saldoInicial)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Receitas</span>
                    <span className="text-success">+ {formatarEuros(r.totalReceitas)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Despesas</span>
                    <span className="text-danger">− {formatarEuros(r.totalDespesas)}</span>
                  </div>
                  <div className="d-flex justify-content-between small mt-2">
                    <span className="text-muted">Nº de movimentos</span>
                    <span>{r.numMovimentos}</span>
                  </div>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-end gap-2">
                  <Button size="sm" variant="outline-primary"
                    onClick={() => abrirEditar(conta)}>Editar</Button>
                  <Button size="sm" variant="outline-danger"
                    onClick={() => remover(conta.documentId)}>Apagar</Button>
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)}>
        <Form onSubmit={guardar}>
          <Modal.Header closeButton>
            <Modal.Title>{editarId ? 'Editar' : 'Nova'} Conta</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control value={form.nome} required
                onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="banco">Banco</option>
                <option value="carteira_digital">Carteira digital</option>
                <option value="cartao">Cartão</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="investimento">Investimento</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Saldo inicial (€)</Form.Label>
              <Form.Control type="number" step="0.01" value={form.saldoInicial}
                onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setMostrarModal(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Guardar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}