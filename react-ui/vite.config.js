import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Tell Vite that main.jsx starts the React part of your blog.
  input: "/src/main.jsx",

  server: {
    cors: {
      // Allow your Express webpage to load files from Vite.
      origin: "http://localhost:3000",
    },
  },

  build: {
    // Create a manifest later when the project is built.
    manifest: true,
  },
});