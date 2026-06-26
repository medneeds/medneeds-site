import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_BASE_URL || "http://localhost:3000/api";

  // Extract origin and path from the configured API URL
  const targetOrigin = new URL(apiUrl).origin;
  const targetPath = new URL(apiUrl).pathname;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: targetOrigin,
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            path.replace(/^\/api/, targetPath === "/" ? "" : targetPath),
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean,
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
