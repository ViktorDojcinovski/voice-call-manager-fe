const viteEnv = import.meta.env;

// Define the types for the environment variables
interface ViteEnv {
  VITE_BACKEND_URL: string;
  VITE_BACKEND_DOMAIN: string;
  MODE: string;
}

const cfg = {
  // Url of the backend app
  backendUrl: viteEnv.VITE_BACKEND_URL,
  backendDomain: viteEnv.VITE_BACKEND_DOMAIN,
  isDevMode: viteEnv.MODE === "development",
};

export default cfg;
