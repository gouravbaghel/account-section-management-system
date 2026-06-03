import client from './client';

export async function getDashboardStats() {
  const response = await client.get('/dashboard/stats');
  return response.data;
}

export async function getDashboardCharts() {
  const response = await client.get('/dashboard/charts');
  return response.data;
}
