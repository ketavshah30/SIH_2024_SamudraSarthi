import { defineConfig } from 'vite';

export default defineConfig({
  root: ".", // Set the root to the project root
  server: {
    open: "/index.html", // Set the default page to open
  },
  build: {
    outDir: "dist", // Ensure build outputs to the correct directory
    rollupOptions: {
      input: {
        index: "/index.html",
      },
    },
  },
});

