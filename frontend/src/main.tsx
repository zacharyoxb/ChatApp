import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Home from "./routes/Home.tsx";
import Login from "./routes/login.tsx";
import SignUp from "./routes/signup.tsx";
import Chats from "./routes/chats.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chats" element={<Chats />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
