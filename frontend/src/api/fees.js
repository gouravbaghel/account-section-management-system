import client from './client';

export async function getFeeStructures(params = {}) {
  const response = await client.get('/fee-structures', { params });
  return response.data;
}

export async function createFeeStructure(data) {
  const response = await client.post('/fee-structures', data);
  return response.data;
}

export async function updateFeeStructure(id, data) {
  const response = await client.put(`/fee-structures/${id}`, data);
  return response.data;
}

export async function getStudentFees(studentId) {
  const response = await client.get('/student-fees', { params: { student_id: studentId } });
  return response.data;
}

export async function assignFees(data) {
  const response = await client.post('/student-fees/assign', data);
  return response.data;
}
