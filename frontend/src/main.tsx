import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Home from "./routes/Home.tsx";
import Login from "./routes/Login.tsx";
import SignUp from "./routes/Signup.tsx";
import Chats from "./routes/Chats.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chats/:chatId?" element={<Chats />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
