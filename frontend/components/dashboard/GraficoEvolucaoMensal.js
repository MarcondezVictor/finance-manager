'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatarEuros } from '@/lib/financas';

// dados: [{ mes: '2026-06', receitas, despesas, saldoAcumulado }, ...] (ver totaisPorMes)
export default function GraficoEvolucaoMensal({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis tickFormatter={(v) => formatarEuros(v)} width={90} />
        <Tooltip formatter={(valor) => formatarEuros(valor)} />
        <Legend />
        <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#198754" strokeWidth={2} />
        <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#dc3545" strokeWidth={2} />
        <Line
          type="monotone"
          dataKey="saldoAcumulado"
          name="Saldo acumulado"
          stroke="#0d6efd"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
