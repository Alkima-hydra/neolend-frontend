const BASE_AUTH = 'http://localhost:3003/api/auth';
const BASE_APPLICANT = 'http://localhost:3003/api/applicants';

const getToken = () => localStorage.getItem('neolend_token');

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${BASE_AUTH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

export async function register(full_name, email, password, role_name = 'SOLICITANTE') {
  const res = await fetch(`${BASE_AUTH}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password, role_name })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

export async function getMe() {
  const res = await fetch(`${BASE_AUTH}/me`, {
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data.usuario;
}

export async function logout() {
  const res = await fetch(`${BASE_AUTH}/logout`, {
    method: 'POST',
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

export async function revalidarToken() {
  const res = await fetch(`${BASE_AUTH}/renew`, {
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

// ─── Applicant ────────────────────────────────────────────────────────────────

export async function crearApplicant(applicantData) {
  const res = await fetch(`${BASE_APPLICANT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-token': getToken()
    },
    body: JSON.stringify(applicantData)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data.applicant;
}

export async function getApplicant(id) {
  const res = await fetch(`${BASE_APPLICANT}/${id}`, {
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data.applicant;
}

export async function actualizarApplicant(id, applicantData) {
  const res = await fetch(`${BASE_APPLICANT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-token': getToken()
    },
    body: JSON.stringify(applicantData)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

export async function subirDocumento(id, documentoData) {
  const res = await fetch(`${BASE_APPLICANT}/${id}/identity-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-token': getToken()
    },
    body: JSON.stringify(documentoData)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data.documento;
}

export async function getProfileStatus(id) {
  const res = await fetch(`${BASE_APPLICANT}/${id}/profile-status`, {
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

export async function getApplicantByUserId(userId) {
  const res = await fetch(`${BASE_APPLICANT}/user/${userId}`, {
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) return null;
  return data.applicant;
}

export async function getAllUsers() {
  const res = await fetch(`${BASE_AUTH}/users`, {
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data.usuarios;
}

export async function createUser(userData) {
  const res = await fetch(`${BASE_AUTH}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-token': getToken()
    },
    body: JSON.stringify({
      full_name: userData.fullName,
      email: userData.email,
      password: userData.password,
      role_name: userData.role,
      phone: userData.phone
    })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data.usuario;
}

export async function updateUserStatus(userId, status) {
  const res = await fetch(`${BASE_AUTH}/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-token': getToken()
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}

export async function deleteUser(userId) {
  const res = await fetch(`${BASE_AUTH}/users/${userId}`, {
    method: 'DELETE',
    headers: { 'x-token': getToken() }
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.msg);
  return data;
}