//const API_BASE = '/api';
//(change 1) const API_BASE = 'http://127.0.0.1:5000/api';
//(change 2) const API_BASE = 'http://localhost:5000/api';
//(change 3) const API_BASE = 'http://[::1]:5000/api';
//(change 4) const API_BASE = 'http://0.0.0.0:5000/api';
//(change 5)const API_BASE = 'http://127.0.0.1:5001/api';
const API_BASE = 'http://127.0.0.1:5001'; // Removed the /api at the end

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface Student {
  id: number;
  roll_number: string;
  name: string;
  department_id: number;
  department_name: string;
  department_code: string;
  year: string;
  division: string;
  parent_phone: string;
}

export interface AttendanceRecord {
  id: number;
  roll_number: string;
  name: string;
  parent_phone: string;
  department_name: string;
  year: string;
  division: string;
  status: 'Present' | 'Absent' | null;
  date: string | null;
}

export interface AdminStats {
  total_students: number;
  present_today: number;
  absent_today: number;
  not_marked_today: number;
  department_stats: { name: string; code: string; student_count: number }[];
  year_stats: { year: string; count: number }[];
  overall_attendance_percentage: number;
  low_attendance_students: {
    id: number;
    name: string;
    roll_number: string;
    parent_phone: string;
    department: string;
    year: string;
    division: string;
    total_days: number;
    present_days: number;
    percentage: number;
  }[];
  recent_notifications: {
    id: number;
    student_id: number;
    student_name: string;
    roll_number: string;
    message: string;
    sent_at: string;
    status: string;
  }[];
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = token;
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return response;
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  const data = await response.json();
  setToken(data.token);
  return { user: data.user, token: data.token };
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetchWithAuth('/auth/me');
  if (!response.ok) {
    throw new Error('Failed to get current user');
  }
  return response.json();
}

export async function getDepartments(): Promise<Department[]> {
  const response = await fetchWithAuth('/departments');
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }
  return response.json();
}

export async function getStudents(params: {
  department_id?: string;
  year?: string;
  division?: string;
}): Promise<Student[]> {
  const searchParams = new URLSearchParams();
  if (params.department_id) searchParams.set('department_id', params.department_id);
  if (params.year) searchParams.set('year', params.year);
  if (params.division) searchParams.set('division', params.division);
  
  const response = await fetchWithAuth(`/students?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }
  return response.json();
}

export async function getAttendance(params: {
  date?: string;
  department_id?: string;
  year?: string;
  division?: string;
}): Promise<AttendanceRecord[]> {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.set('date', params.date);
  if (params.department_id) searchParams.set('department_id', params.department_id);
  if (params.year) searchParams.set('year', params.year);
  if (params.division) searchParams.set('division', params.division);
  
  const response = await fetchWithAuth(`/attendance?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance');
  }
  return response.json();
}

export async function submitAttendance(date: string, records: { student_id: number; status: string }[]): Promise<{
  message: string;
  count: number;
  low_attendance_alerts: { student_id: number; name: string; percentage: number }[];
}> {
  const response = await fetchWithAuth('/attendance', {
    method: 'POST',
    body: JSON.stringify({ date, records }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit attendance');
  }
  
  return response.json();
}

export async function getStudentAttendance(studentId: number): Promise<{
  student: Student;
  records: { date: string; status: string }[];
  total_days: number;
  present_days: number;
  absent_days: number;
  percentage: number;
}> {
  const response = await fetchWithAuth(`/students/${studentId}/attendance`);
  if (!response.ok) {
    throw new Error('Failed to fetch student attendance');
  }
  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetchWithAuth('/admin/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch admin stats');
  }
  return response.json();
}

export async function getAttendanceTrend(days: number = 7): Promise<{ date: string; present: number; absent: number }[]> {
  const response = await fetchWithAuth(`/admin/attendance-trend?days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance trend');
  }
  return response.json();
}

export async function sendWhatsAppNotification(studentId: number): Promise<{ message: string; phone: string; notification_message: string }> {
  const response = await fetchWithAuth('/notifications/send-whatsapp', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send notification');
  }
  
  return response.json();
}

export async function sendBulkNotifications(): Promise<{ message: string; count: number }> {
  const response = await fetchWithAuth('/notifications/send-bulk', {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send bulk notifications');
  }
  
  return response.json();
}
