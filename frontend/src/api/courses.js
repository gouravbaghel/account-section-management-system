import client from './client';

export async function getCourses() {
  const response = await client.get('/courses');
  return response.data;
}

export async function createCourse(data) {
  const response = await client.post('/courses', data);
  return response.data;
}

export async function updateCourse(id, data) {
  const response = await client.put(`/courses/${id}`, data);
  return response.data;
}

export async function deleteCourse(id) {
  const response = await client.delete(`/courses/${id}`);
  return response.data;
}

export async function getBranches(courseId) {
  const response = await client.get('/branches', { params: { course_id: courseId } });
  return response.data;
}

export async function createBranch(data) {
  const response = await client.post('/branches', data);
  return response.data;
}
