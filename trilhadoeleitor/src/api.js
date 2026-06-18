import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:1234';

const api = axios.create({
  baseURL: API_URL,
});

export default api;