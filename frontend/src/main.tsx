import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import "./index.css";
import Home from "./routes/Home.tsx";
import Login from "./routes/Login.tsx";
import SignUp from "./routes/Signup.tsx";
import Chats from "./routes/Chats.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthSession } from "./queries/authQueries.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, error, isLoading } = useAuthSession();
  
  if (isLoading) {
    return <div>Loading session...</div>;
  }
  
  if (!session) {
    // Redirect to login if no session
    if (error?.message == "SESSION_EXPIRED") {
      return <Navigate to="/login" state={{sessionExpired: true}} replace />;
    } else if(error?.message == "COOKIE_NOT_PRESENT") {
      return <Navigate to="/login" state={{noCookie: true}} replace />;
    }
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/chats/:chatId?" element=
          {
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
