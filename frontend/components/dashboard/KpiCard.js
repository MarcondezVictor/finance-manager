import { Card } from 'react-bootstrap';

// Cartão de resumo (KPI). É só apresentação — sem hooks nem Recharts —
// por isso não precisa de 'use client' (herda o modo do componente pai).
export default function KpiCard({ titulo, valor, corTexto = '', subtitulo }) {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="text-uppercase small text-muted">{titulo}</div>
        <h3 className={`mb-0 ${corTexto}`}>{valor}</h3>
        {subtitulo && <div className="small text-muted mt-1">{subtitulo}</div>}
      </Card.Body>
    </Card>
  );
}
