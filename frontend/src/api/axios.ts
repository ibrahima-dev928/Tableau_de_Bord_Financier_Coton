import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Intercepteur pour rafraîchir le token si nécessaire (optionnel)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // gérer déconnexion ou refresh token
    }
    return Promise.reject(error);
  }
);

export default api;