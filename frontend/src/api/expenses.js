import client from './client';

export async function getExpenses(params = {}) {
  const response = await client.get('/expenses', { params });
  return response.data;
}

export async function createExpense(data) {
  const response = await client.post('/expenses', data);
  return response.data;
}

export async function updateExpense(id, data) {
  const response = await client.put(`/expenses/${id}`, data);
  return response.data;
}

export async function deleteExpense(id) {
  const response = await client.delete(`/expenses/${id}`);
  return response.data;
}
