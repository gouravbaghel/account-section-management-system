import client from './client';

export async function getScholarships(params = {}) {
  const response = await client.get('/scholarships', { params });
  return response.data;
}

export async function createScholarship(data) {
  const response = await client.post('/scholarships', data);
  return response.data;
}

export async function updateScholarship(id, data) {
  const response = await client.put(`/scholarships/${id}`, data);
  return response.data;
}
