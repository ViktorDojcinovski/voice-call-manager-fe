const viteEnv = import.meta.env;

// Define the types for the environment variables
interface ViteEnv {
  VITE_BACKEND_URL: string;
  MODE: string;
}

const cfg = {
  // Url of the backend app
  backendUrl: viteEnv.VITE_BACKEND_URL,
  isDevMode: viteEnv.MODE === "development",
};

export default cfg;
