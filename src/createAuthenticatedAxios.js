// Add this at the top of ViewUsers.js, replacing the existing axios import
import axios from 'axios';

// Create an authenticated axios instance
const createAuthenticatedAxios = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const instance = axios.create({
    baseURL: 'http://localhost:5000', // Match the URL you're using in AdminDashboard.js
    headers: {
      'Authorization': token, // Token already includes Bearer prefix
    }
  });
  
  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/'; // Force redirect to login
        return Promise.reject(new Error('Unauthorized - Session expired'));
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

export default createAuthenticatedAxios;