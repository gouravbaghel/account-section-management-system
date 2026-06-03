import client from './client';

// College settings
export async function getSettings() {
  const response = await client.get('/settings');
  return response.data;
}

export async function updateSettings(data) {
  const response = await client.put('/settings', data);
  return response.data;
}

// User management
export async function getUsers() {
  const response = await client.get('/users');
  return response.data;
}

export async function createUser(data) {
  const response = await client.post('/users', data);
  return response.data;
}

export async function updateUser(id, data) {
  const response = await client.put(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id) {
  const response = await client.delete(`/users/${id}`);
  return response.data;
}

// Audit logs
export async function getAuditLogs(params = {}) {
  const response = await client.get('/audit-logs', { params });
  return response.data;
}
