'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { entrar } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState(null);

  async function submeter(e) {
    e.preventDefault();
    setErro(null);
    try {
      await entrar(identifier, password);
      router.push('/movimentos'); // redireciona depois de entrar
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <Card className="mx-auto shadow-sm" style={{ maxWidth: 400 }}>
      <Card.Body>
        <h3 className="mb-3">Entrar</h3>
        {erro && <Alert variant="danger">{erro}</Alert>}
        <Form onSubmit={submeter}>
          <Form.Group className="mb-3">
            <Form.Label>Email ou utilizador</Form.Label>
            <Form.Control value={identifier} required
              onChange={(e) => setIdentifier(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" className="w-100">Entrar</Button>
        </Form>
        <p className="mt-3 mb-0 text-center small">
          Ainda não tens conta? <a href="/registrar">Registra-te</a>
        </p>
      </Card.Body>
    </Card>
  );
}