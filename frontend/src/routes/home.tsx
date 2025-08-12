import { useEffect } from "react";
import "./css/home.css";
import { Link, useNavigate } from "react-router";

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
    <div className="root-div">
      <h1>ChatApp: Basic Group Messaging Service</h1>
      <div id="link-buttons">
        <Link className="link-button" to="/login">
          Login
        </Link>

        <Link className="link-button" to="/signup">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default Home;
