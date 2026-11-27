'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Badge, Alert } from 'react-bootstrap';
import {
  getMovimentos, criarMovimento, atualizarMovimento, apagarMovimento,
  getContas, getEtiquetas, criarEtiqueta,
} from '@/lib/strapi';
import { formatarEuros } from '@/lib/financas';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const FORM_VAZIO = {
  descricao: '', valor: '', data: '', tipo: 'despesa', conta: '', etiquetas: [],
};

export default function MovimentosPage() {
  const { user, pronto } = useAuth(); // saber se há sessão iniciada

  const [movimentos, setMovimentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState(null);

  // estado do modal / formulário
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editarId, setEditarId] = useState(null); // documentId em edição, ou null = criar
  const [form, setForm] = useState(FORM_VAZIO);
  const [novaEtiqueta, setNovaEtiqueta] = useState('');

  // Carrega movimentos + contas + etiquetas em paralelo
  async function carregarDados() {
    try {
      setACarregar(true);
      const [m, c, e] = await Promise.all([getMovimentos(), getContas(), getEtiquetas()]);
      setMovimentos(m); setContas(c); setEtiquetas(e);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setACarregar(false);
    }
  }

  useEffect(() => {
     if (!pronto) return;                 // ainda a verificar a sessão
     if (!user) { setACarregar(false); return; } // sem sessão, não busca nada
     carregarDados();
   }, [pronto, user]);
   
  function abrirCriar() {
    setEditarId(null);
    setForm(FORM_VAZIO);
    setNovaEtiqueta('');
    setMostrarModal(true);
  }

  function abrirEditar(mov) {
    setEditarId(mov.documentId);
    setForm({
      descricao: mov.descricao || '',
      valor: mov.valor ?? '',
      data: mov.data || '',
      tipo: mov.tipo || 'despesa',
      conta: mov.conta?.documentId || '',
      etiquetas: (mov.etiquetas || []).map((e) => e.documentId),
    });
    setNovaEtiqueta('');
    setMostrarModal(true);
  }

  // Cria a etiqueta na API, junta-a à lista disponível e já a seleciona no formulário
  async function criarNovaEtiqueta() {
    const nome = novaEtiqueta.trim();
    if (!nome) return;
    try {
      const etiqueta = await criarEtiqueta(nome);
      setEtiquetas((atuais) => [...atuais, etiqueta]);
      setForm((f) => ({ ...f, etiquetas: [...f.etiquetas, etiqueta.documentId] }));
      setNovaEtiqueta('');
    } catch (err) {
      setErro(err.message);
    }
  }

  // Guardar: decide entre criar e atualizar
  async function guardar(evento) {
    evento.preventDefault();
    try {
      const dados = {
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        data: form.data,
        tipo: form.tipo,
        conta: form.conta || null,      // relação 1-N (documentId da conta)
        etiquetas: form.etiquetas,      // relação M-N (array de documentIds)
      };
      if (editarId) {
        await atualizarMovimento(editarId, dados);
      } else {
        await criarMovimento(dados);
      }
      setMostrarModal(false);
      await carregarDados(); // recarrega a tabela
    } catch (err) {
      setErro(err.message);
    }
  }

  async function remover(documentId) {
    if (!confirm('Tem a certeza que quer apagar este movimento?')) return;
    try {
      await apagarMovimento(documentId);
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
          Precisas de iniciar sessão para ver os teus movimentos.{' '}
          <Link href="/login">Entrar</Link>
        </Alert>
      );
    }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Movimentos</h2>
        {user && <Button onClick={abrirCriar}>+ Novo Movimento</Button>}
      </div>

      {erro && (
        <Alert variant="danger" onClose={() => setErro(null)} dismissible>{erro}</Alert>
      )}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Descrição</th><th>Valor</th><th>Data</th><th>Tipo</th>
            <th>Conta</th><th>Etiquetas</th>
            {user && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {movimentos.length === 0 && (
            <tr><td colSpan={user ? 7 : 6} className="text-center">Sem movimentos.</td></tr>
          )}
          {movimentos.map((mov) => (
            <tr key={mov.documentId}>
              <td>{mov.descricao}</td>
              <td>{formatarEuros(mov.valor)}</td>
              <td>{mov.data}</td>
              <td>
                <Badge bg={mov.tipo === 'receita' ? 'success' : 'danger'}>{mov.tipo}</Badge>
              </td>
              <td>{mov.conta?.nome || '—'}</td>
              <td>
                {(mov.etiquetas || []).map((e) => (
                  <Badge bg="secondary" className="me-1" key={e.documentId}>{e.nome}</Badge>
                ))}
              </td>
              {user && (
                <td>
                  <Button size="sm" variant="outline-primary" className="me-2"
                    onClick={() => abrirEditar(mov)}>Editar</Button>
                  <Button size="sm" variant="outline-danger"
                    onClick={() => remover(mov.documentId)}>Apagar</Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      {/* MODAL: serve para CRIAR e EDITAR */}
      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)}>
        <Form onSubmit={guardar}>
          <Modal.Header closeButton>
            <Modal.Title>{editarId ? 'Editar' : 'Novo'} Movimento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control value={form.descricao} required
                onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Valor (€)</Form.Label>
              <Form.Control type="number" step="0.01" value={form.valor} required
                onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Data</Form.Label>
              <Form.Control type="date" value={form.data} required
                onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Conta (relação 1-N)</Form.Label>
              <Form.Select value={form.conta}
                onChange={(e) => setForm({ ...form, conta: e.target.value })}>
                <option value="">— escolher —</option>
                {contas.map((c) => (
                  <option key={c.documentId} value={c.documentId}>{c.nome}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Etiquetas (relação M-N — Ctrl+clique para várias)</Form.Label>
              <Form.Select multiple value={form.etiquetas}
                onChange={(e) => setForm({
                  ...form,
                  etiquetas: Array.from(e.target.selectedOptions, (o) => o.value),
                })}>
                {etiquetas.map((et) => (
                  <option key={et.documentId} value={et.documentId}>{et.nome}</option>
                ))}
              </Form.Select>
              <div className="d-flex gap-2 mt-2">
                <Form.Control
                  size="sm"
                  placeholder="Nova etiqueta"
                  value={novaEtiqueta}
                  onChange={(e) => setNovaEtiqueta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); criarNovaEtiqueta(); }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline-secondary"
                  disabled={!novaEtiqueta.trim()}
                  onClick={criarNovaEtiqueta}
                >
                  + Criar etiqueta
                </Button>
              </div>
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