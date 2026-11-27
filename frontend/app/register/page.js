'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await signUp(username, email, password);
      router.push('/accounts'); // new users start by creating an account
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card className="mx-auto shadow-sm" style={{ maxWidth: 400 }}>
      <Card.Body>
        <h3 className="mb-3">Create an account</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
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
          <Button type="submit" variant="success" className="w-100">Sign up</Button>
        </Form>
        <p className="mt-3 mb-0 text-center small">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
