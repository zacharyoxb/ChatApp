import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
    https: {
      key: fs.readFileSync("certs/ChatApp-Server.key"),
      cert: fs.readFileSync("certs/ChatApp-Server.crt"),
    },
    hmr: {
      protocol: "wss",
      host: "localhost",
      port: 4000,
    },
  },
  plugins: [react()],
});
