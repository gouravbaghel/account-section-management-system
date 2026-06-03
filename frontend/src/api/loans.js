import client from './client';

export async function getLoans(params = {}) {
  const response = await client.get('/loans', { params });
  return response.data;
}

export async function createLoan(data) {
  const response = await client.post('/loans', data);
  return response.data;
}

export async function updateLoan(id, data) {
  const response = await client.put(`/loans/${id}`, data);
  return response.data;
}

export async function getLoanInstallments(loanId) {
  const response = await client.get(`/loans/${loanId}/installments`);
  return response.data;
}

export async function createLoanInstallment(loanId, data) {
  const response = await client.post(`/loans/${loanId}/installments`, data);
  return response.data;
}
