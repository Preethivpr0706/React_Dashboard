import axios from 'axios';

const createAuthenticatedAxios = () => {
    const instance = axios.create({
        baseURL: 'http://localhost:5000', // Ensure this matches your backend URL
        withCredentials: true, // Enable cookies in requests
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add response interceptor to handle 401 errors
    instance.interceptors.response.use(
        response => response,
        error => {
            if (error.response && error.response.status === 401) {
                window.location.href = '/'; // Redirect to login page
                return Promise.reject(new Error('Unauthorized - Session expired'));
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

export default createAuthenticatedAxios;