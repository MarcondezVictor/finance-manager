'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, registar as apiRegistar } from '@/lib/strapi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pronto, setPronto] = useState(false); // já verificou o localStorage?

  // Ao arrancar, recupera a sessão guardada (se existir)
  useEffect(() => {
    const guardado = localStorage.getItem('user');
    if (guardado) setUser(JSON.parse(guardado));
    setPronto(true);
  }, []);

  function guardarSessao(jwt, utilizador) {
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('user', JSON.stringify(utilizador));
    setUser(utilizador);
  }

  async function entrar(identifier, password) {
    const { jwt, user } = await apiLogin(identifier, password);
    guardarSessao(jwt, user);
  }

  async function registrarUtilizador(username, email, password) {
    const { jwt, user } = await apiRegistar(username, email, password);
    guardarSessao(jwt, user);
  }

  function sair() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, pronto, entrar, registrarUtilizador, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// Atalho para usar o contexto em qualquer componente
export function useAuth() {
  return useContext(AuthContext);
}