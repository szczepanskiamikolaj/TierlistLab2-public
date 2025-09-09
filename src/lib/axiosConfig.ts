import axios from 'axios';
import { firebaseAuth } from './firebaseConfig';

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the authentication token to headers
axiosInstance.interceptors.request.use(
  async (config) => {
    const auth = firebaseAuth;
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken(true); // Ensure token is always fresh
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
