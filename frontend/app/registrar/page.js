'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

export default function RegistrarPage() {
  const { registrarUtilizador } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState(null);

  async function submeter(e) {
    e.preventDefault();
    setErro(null);
    try {
      await registrarUtilizador(username, email, password);
      router.push('/movimentos');
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <Card className="mx-auto shadow-sm" style={{ maxWidth: 400 }}>
      <Card.Body>
        <h3 className="mb-3">Criar conta</h3>
        {erro && <Alert variant="danger">{erro}</Alert>}
        <Form onSubmit={submeter}>
          <Form.Group className="mb-3">
            <Form.Label>Nome de utilizador</Form.Label>
            <Form.Control value={username} required
              onChange={(e) => setUsername(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" variant="success" className="w-100">Registar</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}