import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001"
});

api.interceptors.request.use(
  (config) => {
    const usuario = localStorage.getItem("usuario");

    if (usuario) {
      const dadosUsuario = JSON.parse(usuario);

      if (dadosUsuario.token) {
        config.headers.Authorization = `Bearer ${dadosUsuario.token}`;
      }

      if (dadosUsuario.googleId) {
        config.headers["X-Google-ID"] = dadosUsuario.googleId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;