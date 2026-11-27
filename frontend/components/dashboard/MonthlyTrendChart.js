'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatMonth } from '@/lib/finance';

// data: [{ month: '2026-06', income, expenses, balance }, ...] (see totalsByMonth)
export default function MonthlyTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tickFormatter={formatMonth} />
        <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} />
        <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonth} />
        <Legend />
        <Line type="monotone" dataKey="income" name="Income" stroke="#198754" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc3545" strokeWidth={2} />
        <Line
          type="monotone"
          dataKey="balance"
          name="Running balance"
          stroke="#0d6efd"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
