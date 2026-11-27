'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await signIn(identifier, password);
      router.push('/'); // go to the dashboard after signing in
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card className="mx-auto shadow-sm" style={{ maxWidth: 400 }}>
      <Card.Body>
        <h3 className="mb-3">Sign in</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email or username</Form.Label>
            <Form.Control value={identifier} required
              onChange={(e) => setIdentifier(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" className="w-100">Sign in</Button>
        </Form>
        <p className="mt-3 mb-0 text-center small">
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
