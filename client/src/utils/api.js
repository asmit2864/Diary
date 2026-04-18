// Use relative URLs so all requests flow through CRA's dev proxy
// (or directly to Express in production). This avoids Mixed Content
// errors when the React dev server runs on HTTPS.
const BACKEND_URI = process.env.REACT_APP_BACKEND_URL || '';   // relative — proxy handles routing in dev

const BASE_AUTH = `${BACKEND_URI}/auth`;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const fetchMe = async () => {
  const res = await fetch(BASE_AUTH + '/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
};

export const loginUser = async (email, password) => {
  const res = await fetch(BASE_AUTH + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const loginWithGoogle = async (credential) => {
  const res = await fetch(BASE_AUTH + '/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Google Login failed');
  return data;
};

export const registerUser = async (email, password) => {
  const res = await fetch(BASE_AUTH + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

export const logoutUser = async () => {
  await fetch(BASE_AUTH + '/logout', { method: 'POST', credentials: 'include' });
};

export const setVaultPin = async (pin) => {
  const res = await fetch(BASE_AUTH + '/set-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to set PIN');
  return data;
};

export const verifyVaultPin = async (pin) => {
  const res = await fetch(BASE_AUTH + '/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Verification failed');
  return data;
};

// ── Notes/Documents/Accounts Dynamism ─────────────────────────────────────────

const getEndpoint = (category) => {
  if (category === 'Documents') return `${BACKEND_URI}/api/documents`;
  if (category === 'Accounts') return `${BACKEND_URI}/api/accounts`;
  if (category === 'Expenses') return `${BACKEND_URI}/api/expenses`;
  return `${BACKEND_URI}/api/notes`;
};

export const fetchNotes = async (category) => {
  const res = await fetch(getEndpoint(category), { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch ${category}`);
  return res.json();
};

export const createNote = async (data) => {
  const res = await fetch(getEndpoint(data.category), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
};

export const updateNote = async (id, data) => {
  const res = await fetch(`${getEndpoint(data.category)}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
};

export const deleteNote = async (id, category) => {
  const res = await fetch(`${getEndpoint(category)}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
};
