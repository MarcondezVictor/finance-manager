const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const PAGE_SIZE = 100; // Strapi's maxLimit (backend/config/api.js)

// Reads the token stored in the browser (only exists client-side)
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} while calling ${endpoint}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

// Fetches every page of a collection. Strapi returns 25 records per request by
// default, so a single call would silently drop older records.
async function getAll(endpoint) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const records = [];
  let page = 1;
  let pageCount = 1;
  do {
    const json = await request(
      `${endpoint}${separator}pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
    );
    records.push(...json.data);
    pageCount = json.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);
  return records;
}

const send = (endpoint, method, data) =>
  request(endpoint, { method, body: JSON.stringify({ data }) }); // Strapi expects { data: {...} }

// Transactions
export const getTransactions = () => getAll('/transactions?populate=*&sort=date:desc');
export const createTransaction = (data) => send('/transactions', 'POST', data);
export const updateTransaction = (documentId, data) => send(`/transactions/${documentId}`, 'PUT', data);
export const deleteTransaction = (documentId) => request(`/transactions/${documentId}`, { method: 'DELETE' });

// Accounts
export const getAccounts = () => getAll('/accounts?sort=name:asc');
export const createAccount = (data) => send('/accounts', 'POST', data);
export const updateAccount = (documentId, data) => send(`/accounts/${documentId}`, 'PUT', data);
export const deleteAccount = (documentId) => request(`/accounts/${documentId}`, { method: 'DELETE' });

// Tags
export const getTags = () => getAll('/tags?sort=name:asc');
export async function createTag(name) {
  const json = await send('/tags', 'POST', { name });
  return json.data;
}

// Auth
async function auth(endpoint, body, fallbackMessage) {
  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || fallbackMessage);
  }
  return json; // { jwt, user }
}

// Creates a new user (gets the Authenticated role)
export const register = (username, email, password) =>
  auth('/auth/local/register', { username, email, password }, 'Registration failed');

// identifier can be the email OR the username
export const login = (identifier, password) =>
  auth('/auth/local', { identifier, password }, 'Invalid credentials');
