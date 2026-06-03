import client from './client';

export async function login(username, password) {
  const response = await client.post('/auth/login', { username, password });
  return response.data;
}

export async function refreshToken(token) {
  const response = await client.post('/auth/refresh', { refresh_token: token });
  return response.data;
}

export async function getMe() {
  const response = await client.get('/auth/me');
  return response.data;
}
