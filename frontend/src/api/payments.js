import client from './client';

export async function getPayments(params = {}) {
  const response = await client.get('/payments', { params });
  return response.data;
}

export async function createPayment(data) {
  const response = await client.post('/payments', data);
  return response.data;
}

export async function cancelPayment(id, reason) {
  const response = await client.post(`/payments/${id}/cancel`, { reason });
  return response.data;
}

export async function getReceiptPdf(paymentId) {
  const response = await client.get(`/receipts/${paymentId}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}
