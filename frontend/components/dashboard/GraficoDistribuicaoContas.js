'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatarEuros } from '@/lib/financas';

// dados: [{ nome, total }, ...] ordenado da maior para a menor despesa (ver totaisPorConta)
export default function GraficoDistribuicaoContas({ dados }) {
  const altura = Math.max(200, dados.length * 50);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => formatarEuros(v)} />
        <YAxis type="category" dataKey="nome" width={100} />
        <Tooltip formatter={(valor) => formatarEuros(valor)} />
        <Bar dataKey="total" name="Despesas" fill="#dc3545" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
