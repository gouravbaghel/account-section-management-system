import client from './client';

export async function getRefunds(params = {}) {
  const response = await client.get('/refunds', { params });
  return response.data;
}

export async function createRefund(data) {
  const response = await client.post('/refunds', data);
  return response.data;
}

export async function updateRefund(id, data) {
  const response = await client.put(`/refunds/${id}`, data);
  return response.data;
}
