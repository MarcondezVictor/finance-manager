'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatarEuros } from '@/lib/financas';

const CORES = { Receitas: '#198754', Despesas: '#dc3545' };

// dados: [{ tipo: 'Receitas', total }, { tipo: 'Despesas', total }] (ver totaisPorTipo)
export default function GraficoReceitasDespesas({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={dados}
          dataKey="total"
          nameKey="tipo"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {dados.map((entrada) => (
            <Cell key={entrada.tipo} fill={CORES[entrada.tipo]} />
          ))}
        </Pie>
        <Tooltip formatter={(valor) => formatarEuros(valor)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
