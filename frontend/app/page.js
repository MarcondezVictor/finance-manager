'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { getContas, getMovimentos } from '@/lib/strapi';
import {
  resumoConta, formatarEuros, totaisPorTipo, totaisPorMes, totaisPorConta,
} from '@/lib/financas';
import { useAuth } from '@/context/AuthContext';
import KpiCard from '@/components/dashboard/KpiCard';
import GraficoReceitasDespesas from '@/components/dashboard/GraficoReceitasDespesas';
import GraficoEvolucaoMensal from '@/components/dashboard/GraficoEvolucaoMensal';
import GraficoDistribuicaoContas from '@/components/dashboard/GraficoDistribuicaoContas';

export default function Home() {
  const { user, pronto } = useAuth();

  const [contas, setContas] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!pronto) return;
    if (!user) { setACarregar(false); return; }

    (async () => {
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
    })();
  }, [pronto, user]);

  if (!pronto || aCarregar) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }

  if (!user) {
    return (
      <Alert variant="warning">
        Precisas de iniciar sessão para ver o teu dashboard.{' '}
        <Link href="/login">Entrar</Link>
      </Alert>
    );
  }

  if (erro) {
    return <Alert variant="danger">{erro}</Alert>;
  }

  if (movimentos.length === 0) {
    return (
      <div className="text-center py-5">
        <h2>Bem-vindo ao Gestor de Finanças</h2>
        <p className="text-muted">Ainda não tens movimentos registados.</p>
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Link href="/contas" className="btn btn-outline-primary">Gerir contas</Link>
          <Link href="/movimentos" className="btn btn-primary">Registar movimento</Link>
        </div>
      </div>
    );
  }

  const saldoInicialTotal = contas.reduce((soma, c) => soma + (Number(c.saldoInicial) || 0), 0);
  const patrimonioTotal = contas.reduce(
    (soma, c) => soma + resumoConta(c, movimentos).saldoAtual, 0
  );

  const dadosPorTipo = totaisPorTipo(movimentos);
  const dadosPorMes = totaisPorMes(movimentos, saldoInicialTotal);
  const dadosPorConta = totaisPorConta(contas, movimentos);

  const totalReceitas = dadosPorTipo.find((d) => d.tipo === 'Receitas')?.total || 0;
  const totalDespesas = dadosPorTipo.find((d) => d.tipo === 'Despesas')?.total || 0;

  // Mês atual construído a partir de partes locais (não toISOString), para não
  // arriscar saltar de mês por causa do fuso horário perto da meia-noite.
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const dadosMesAtual = dadosPorMes.find((m) => m.mes === mesAtual);
  const saldoMesAtual = dadosMesAtual ? dadosMesAtual.receitas - dadosMesAtual.despesas : 0;

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>

      <Row xs={1} md={2} lg={4} className="g-3 mb-4">
        <Col>
          <KpiCard titulo="Património total" valor={formatarEuros(patrimonioTotal)} />
        </Col>
        <Col>
          <KpiCard
            titulo="Total de receitas"
            valor={formatarEuros(totalReceitas)}
            corTexto="text-success"
          />
        </Col>
        <Col>
          <KpiCard
            titulo="Total de despesas"
            valor={formatarEuros(totalDespesas)}
            corTexto="text-danger"
          />
        </Col>
        <Col>
          <KpiCard
            titulo="Saldo do mês atual"
            valor={formatarEuros(saldoMesAtual)}
            corTexto={saldoMesAtual >= 0 ? 'text-success' : 'text-danger'}
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Receitas vs Despesas</Card.Title>
              <GraficoReceitasDespesas dados={dadosPorTipo} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h6">Despesas por conta</Card.Title>
              <GraficoDistribuicaoContas dados={dadosPorConta} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="h6">Evolução mensal</Card.Title>
              <GraficoEvolucaoMensal dados={dadosPorMes} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
