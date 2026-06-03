import client from './client';

export async function getStudents(params = {}) {
  const response = await client.get('/students', { params });
  return response.data;
}

export async function createStudent(data) {
  const response = await client.post('/students', data);
  return response.data;
}

export async function getStudent(id) {
  const response = await client.get(`/students/${id}`);
  return response.data;
}

export async function updateStudent(id, data) {
  const response = await client.put(`/students/${id}`, data);
  return response.data;
}

export async function getStudentLedger(id) {
  const response = await client.get(`/students/${id}/ledger`);
  return response.data;
}
