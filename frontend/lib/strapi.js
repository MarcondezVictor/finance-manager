const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Le o token guardado no navegador (só existe no lado do cliente)
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

async function pedido(endpoint, opcoes = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`; // o "crachá"

  const resposta = await fetch(`${STRAPI_URL}/api${endpoint}`, {
    ...opcoes,
    headers: { ...headers, ...opcoes.headers },
  });

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao chamar ${endpoint}`);
  }
  if (resposta.status === 204) return null;
  return resposta.json();
}

// CRUD dos Movimentos

// CREATE — criar um novo
export async function criarMovimento(dados) {
  return pedido('/movimentos', {
    method: 'POST',
    body: JSON.stringify({ data: dados }), // o Strapi exige { data: {...} }
  });
}

// READ — listar todos (com as relações via populate=*)
export async function getMovimentos() {
  const json = await pedido('/movimentos?populate=*&sort=data:desc');
  return json.data;
}

// UPDATE — atualizar (usa o documentId)
export async function atualizarMovimento(documentId, dados) {
  return pedido(`/movimentos/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: dados }),
  });
}

// DELETE — apagar (usa o documentId)
export async function apagarMovimento(documentId) {
  return pedido(`/movimentos/${documentId}`, { method: 'DELETE' });
}

// Auxiliares do Dropdown
 
export async function getContas() {
  const json = await pedido('/contas');
  return json.data;
}

export async function getEtiquetas() {
  const json = await pedido('/etiquetas');
  return json.data;
}

export async function criarEtiqueta(nome) {
  const json = await pedido('/etiquetas', {
    method: 'POST',
    body: JSON.stringify({ data: { nome } }),
  });
  return json.data;
}

// REGISTRO — cria um utilizador novo (fica com o papel Authenticated)
export async function registar(username, email, password) {
  const resposta = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json?.error?.message || 'Erro no registo');
  }
  return json; // { jwt, user }
}

// LOGIN — identifier pode ser o email OU o username
export async function login(identifier, password) {
  const resposta = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json?.error?.message || 'Credenciais inválidas');
  }
  return json; // { jwt, user }
}

export async function criarConta(dados) {
  return pedido('/contas', { method: 'POST', body: JSON.stringify({ data: dados }) });
}
export async function atualizarConta(documentId, dados) {
  return pedido(`/contas/${documentId}`, { method: 'PUT', body: JSON.stringify({ data: dados }) });
}
export async function apagarConta(documentId) {
  return pedido(`/contas/${documentId}`, { method: 'DELETE' });
}