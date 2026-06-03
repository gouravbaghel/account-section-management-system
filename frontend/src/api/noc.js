import client from './client';

export async function getNOCRequests(params = {}) {
  const response = await client.get('/noc', { params });
  return response.data;
}

export async function createNOCRequest(data) {
  const response = await client.post('/noc', data);
  return response.data;
}

export async function updateNOCRequest(id, data) {
  const response = await client.put(`/noc/${id}`, data);
  return response.data;
}
