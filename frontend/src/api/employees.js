import client from './client';

export async function getEmployees(params = {}) {
  const response = await client.get('/employees', { params });
  return response.data;
}

export async function createEmployee(data) {
  const response = await client.post('/employees', data);
  return response.data;
}

export async function updateEmployee(id, data) {
  const response = await client.put(`/employees/${id}`, data);
  return response.data;
}

export async function getSalaries(employeeId) {
  const response = await client.get(`/employees/${employeeId}/salaries`);
  return response.data;
}

export async function createSalary(employeeId, data) {
  const response = await client.post(`/employees/${employeeId}/salaries`, data);
  return response.data;
}

export async function getClaims(employeeId) {
  const response = await client.get(`/employees/${employeeId}/claims`);
  return response.data;
}

export async function createClaim(employeeId, data) {
  const response = await client.post(`/employees/${employeeId}/claims`, data);
  return response.data;
}

export async function updateClaim(claimId, data) {
  const response = await client.put(`/employees/claims/${claimId}`, data);
  return response.data;
}
