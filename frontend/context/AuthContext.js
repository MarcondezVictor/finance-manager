'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '@/lib/strapi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // has localStorage been checked yet?

  // On startup, restore the saved session (if any)
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    setReady(true);
  }, []);

  function saveSession(jwt, newUser) {
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }

  async function signIn(identifier, password) {
    const { jwt, user } = await apiLogin(identifier, password);
    saveSession(jwt, user);
  }

  async function signUp(username, email, password) {
    const { jwt, user } = await apiRegister(username, email, password);
    saveSession(jwt, user);
  }

  function signOut() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut to use the context in any component
export function useAuth() {
  return useContext(AuthContext);
}
