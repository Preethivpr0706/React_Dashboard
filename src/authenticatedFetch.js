// authenticatedFetch.js
const authenticatedFetch = async(url, options = {}) => {
    try {
        const response = await fetch(`http://localhost:5000${url}`, {
            ...options,
            credentials: 'include', // Ensure cookies are sent with requests
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
            },
        });

        // Return the response object instead of JSON
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

export default authenticatedFetch;