import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
        react(),
        tailwindcss(),
    ],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, ""),
            },
        },
    },
});
