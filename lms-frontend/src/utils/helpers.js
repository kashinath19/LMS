// Format date to YYYY-MM-DD for date inputs
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Get initials from name
export const getInitials = (firstName = '', lastName = '', fallback = 'U') => {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();
  
  return initials || fallback;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (basic validation)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Get user-friendly role display
export const getRoleDisplay = (role) => {
  const roleLabels = {
    admin: 'Administrator',
    trainer: 'Trainer',
    student: 'Student'
  };
  return roleLabels[role] || role;
};

// Get color for role
export const getRoleColor = (role) => {
  const roleColors = {
    admin: '#7209b7',
    trainer: '#f8961e',
    student: '#2d936c'
  };
  return roleColors[role] || '#6b7280';
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Check if object is empty
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

// Create form data object from form element
export const getFormData = (formElement) => {
  const formData = new FormData(formElement);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
};