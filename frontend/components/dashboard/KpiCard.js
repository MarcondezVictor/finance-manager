import { Card } from 'react-bootstrap';

// Summary (KPI) card. Presentation only — no hooks or Recharts —
// so it doesn't need 'use client' (it inherits the parent component's mode).
export default function KpiCard({ title, value, textColor = '', subtitle }) {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="text-uppercase small text-muted">{title}</div>
        <h3 className={`mb-0 ${textColor}`}>{value}</h3>
        {subtitle && <div className="small text-muted mt-1">{subtitle}</div>}
      </Card.Body>
    </Card>
  );
}
