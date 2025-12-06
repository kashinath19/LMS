export const API_BASE_URL = 'https://learning-management-system-a258.onrender.com/api/v1';

export const ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  STUDENT: 'student'
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  trainer: 'Trainer',
  student: 'Student'
};

export const ROLE_COLORS = {
  admin: '#7209b7',
  trainer: '#f8961e',
  student: '#2d936c'
};

export const ENDPOINTS = {
  LOGIN: {
    admin: '/auth/login-admin',
    trainer: '/auth/login-trainer',
    student: '/auth/login-student'
  },
  PROFILE: {
    student: '/profiles/student',
    trainer: '/profiles/trainer'
  }
};

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@lms.edu',
    password: 'Admin@2023',
    icon: 'fa-user-shield',
    label: 'Administrator Access',
    placeholder: 'administrator@institution.edu'
  },
  trainer: {
    email: 'trainer@lms.edu',
    password: 'Trainer@2023',
    icon: 'fa-chalkboard-teacher',
    label: 'Trainer Access',
    placeholder: 'trainer@institution.edu'
  },
  student: {
    email: 'student@lms.edu',
    password: 'Student@2023',
    icon: 'fa-user-graduate',
    label: 'Student Access',
    placeholder: 'student@institution.edu'
  }
};

export const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};