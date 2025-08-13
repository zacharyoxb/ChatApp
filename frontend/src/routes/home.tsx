import { useEffect } from "react";
import "./css/home.css";
import { useNavigate } from "react-router";
import { LinkButton } from "../components/LinkButton";

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
        <LinkButton to="/login">Login</LinkButton>
        <LinkButton to="/signup">Sign Up</LinkButton>
      </div>
    </div>
  );
}

export default Home;
