import axios from "axios";

import { history } from "./utils/history";

import config from "./config";

const api = axios.create({
  baseURL: `${config.backendUrl}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.error("Unathorized! Logging out...");
        history.push("/");
      } else if (error.response.status === 500) {
        console.error("Server error! Try again later!");
      }
    } else {
      console.error("Network error or no response from the server.");
    }

    return Promise.reject(error);
  }
);

export default api;
