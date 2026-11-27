'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function NavBar() {
  const { user, sair } = useAuth();

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark px-4">
      <span className="navbar-brand mb-0">Gestor de Finanças</span>
      <div className="navbar-nav ms-auto align-items-center">
        <Link href="/" className="nav-link">Dashboard</Link>
        <Link href="/contas" className="nav-link">Contas</Link>
        <Link href="/movimentos" className="nav-link">Movimentos</Link>
        {user ? (
          <>
            <span className="navbar-text text-light ms-3 me-3">Olá, {user.username}</span>
            <button className="btn btn-outline-light btn-sm" onClick={sair}>Sair</button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">Entrar</Link>
            <Link href="/registrar" className="nav-link">Registrar</Link>
          </>
        )}
      </div>
    </nav>
  );
}