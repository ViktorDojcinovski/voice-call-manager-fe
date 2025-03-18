const viteEnv = import.meta.env;

const cfg = {
  // Url of the backend app
  backendUrl: viteEnv.VITE_BACKEND_URL,
  isDevMode: viteEnv.MODE === "development",
};

export default cfg;
