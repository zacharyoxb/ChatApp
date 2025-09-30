import { useEffect } from "react";
import "./css/home.css";
import { useNavigate } from "react-router";
import { StyledButton } from "../components/StyledButton";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("https://localhost:8000/session", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          navigate("/chats");
        }
      } catch {}
    }
    checkSession();
  }, [navigate]);

  return (
    <div id="parent-div">
      <h1>ChatApp: Basic Group Messaging Service</h1>
      <div id="link-buttons">
        <StyledButton onClick={() => navigate("/login")}>Login</StyledButton>
        <StyledButton onClick={() => navigate("/signup")}>Sign Up</StyledButton>
      </div>
    </div>
  );
}

export default Home;
