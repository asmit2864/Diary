const BACKEND_URI = process.env.REACT_APP_BACKEND_URI || '';
const BASE_AUTH = `${BACKEND_URI}/auth`;
const BASE_NOTES = `${BACKEND_URI}/api/notes`;

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

// ── Notes ─────────────────────────────────────────────────────────────────────
export const fetchNotes = async (category) => {
  const url = category
    ? `${BASE_NOTES}?category=${encodeURIComponent(category)}`
    : BASE_NOTES;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
};

export const createNote = async (data) => {
  const res = await fetch(BASE_NOTES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
};

export const updateNote = async (id, data) => {
  const res = await fetch(`${BASE_NOTES}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
};

export const deleteNote = async (id) => {
  const res = await fetch(`${BASE_NOTES}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete note');
  return res.json();
};
