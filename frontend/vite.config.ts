import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 3000,
    https: {
      key: fs.readFileSync("certs/ChatApp-Server.key"),
      cert: fs.readFileSync("certs/ChatApp-Server.crt"),
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3000,
    },
  },
  plugins: [react()],
});
