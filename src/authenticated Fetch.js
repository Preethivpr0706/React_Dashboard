// Utility function for authenticated API requests
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token, // Token already includes Bearer prefix
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/'; // Force redirect to login
      throw new Error('Unauthorized - Session expired');
    }
    throw new Error(`Request failed with status: ${response.status}`);
  }
  
  return response;
};
export default authenticatedFetch;