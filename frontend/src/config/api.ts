// Retrieve base API URL from environment variables, defaulting to local port 5000
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
