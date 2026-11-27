'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/finance';

// data: [{ name, total }, ...] sorted from highest to lowest spending (see expensesByAccount)
export default function ExpensesByAccountChart({ data }) {
  const height = Math.max(200, data.length * 50);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
        <YAxis type="category" dataKey="name" width={110} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Bar dataKey="total" name="Expenses" fill="#dc3545" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
