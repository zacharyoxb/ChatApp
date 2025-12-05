import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router";
import "./index.css";
import Home from "./routes/Home.tsx";
import Login from "./routes/Login.tsx";
import SignUp from "./routes/Signup.tsx";
import Chats from "./routes/Chats.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthSession } from "./queries/authQueries.ts";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data: session, isLoading } = useAuthSession();

  useEffect(() => {
    if(!isLoading && !session?.isAuthenticated) {
      if (session?.error == "SESSION_EXPIRED") {
      navigate("/login", {replace: true, state: {sessionExpired: true}})
    } else if(session?.error == "COOKIE_NOT_PRESENT") {
      navigate("/login", {replace: true, state: {noCookie: true}})
    }
    navigate("/login")
    }
  }, [isLoading, session, navigate]);
  
   // Loading state
  if (isLoading) {
    return <div>Checking authentication...</div>;
  }
  
  // Only render children if authenticated
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
      {/* <ReactQueryDevtools initialIsOpen={true} /> */}
    </QueryClientProvider>
  </StrictMode>
);
