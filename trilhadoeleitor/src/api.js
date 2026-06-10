import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:1234',
});

export default api;