import axios from 'axios';


const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email, password, role) => {
    const endpoints = {
      admin: '/auth/login-admin',
      trainer: '/auth/login-trainer',
      student: '/auth/login-student',
    };
    return api.post(endpoints[role], { email, password });
  },
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
};

export const profileAPI = {
  // Student endpoints
  getStudentProfile: () => api.get('/profiles/student'),
  getStudentProfileById: (id) => api.get(`/profiles/student/${id}`),
  createStudentProfile: (data) => api.post('/profiles/student', data),
  updateStudentProfile: (data) => api.patch('/profiles/student', data),

  // Trainer endpoints
  getTrainerProfile: () => api.get('/profiles/trainer'),
  createTrainerProfile: (data) => api.post('/profiles/trainer', data),
  updateTrainerProfile: (data) => api.patch('/profiles/trainer', data),

  // Admin endpoints
  getAdminProfile: (opts = {}) => {
    // Prefer fetching the admin via users/{user_id} when we have a user id,
    // because some backends don't expose /profiles/admin.
    try {
      const userId = localStorage.getItem('user_id') || opts.userId || null;
      if (userId) {
        return api.get(`/users/${encodeURIComponent(userId)}`);
      }
    } catch (e) {
      // ignore localStorage errors and fall back
    }

    // Fallback to the old profiles endpoint if no user id is available
    return api.get('/profiles/admin');
  },
  createAdminProfile: (data) => api.post('/profiles/admin', data),
  updateAdminProfile: (data) => api.patch('/profiles/admin', data),
};

export default api;