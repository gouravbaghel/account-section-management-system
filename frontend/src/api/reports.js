import client from './client';

export async function getReport(reportType, params = {}) {
  const response = await client.get(`/reports/${reportType}`, { params });
  return response.data;
}

export async function downloadReportCSV(reportType, params = {}) {
  const response = await client.get(`/reports/${reportType}`, {
    params: { ...params, format: 'csv' },
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadReportExcel(reportType, params = {}) {
  const response = await client.get(`/reports/${reportType}`, {
    params: { ...params, format: 'excel' },
    responseType: 'blob',
  });
  return response.data;
}
