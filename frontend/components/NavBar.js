'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark px-4">
      <span className="navbar-brand mb-0">Finance Manager</span>
      <div className="navbar-nav ms-auto align-items-center">
        <Link href="/" className="nav-link">Dashboard</Link>
        <Link href="/accounts" className="nav-link">Accounts</Link>
        <Link href="/transactions" className="nav-link">Transactions</Link>
        {user ? (
          <>
            <span className="navbar-text text-light ms-3 me-3">Hi, {user.username}</span>
            <button className="btn btn-outline-light btn-sm" onClick={signOut}>Sign out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">Sign in</Link>
            <Link href="/register" className="nav-link">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
