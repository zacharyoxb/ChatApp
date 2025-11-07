import { useEffect } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router";
import { StyledButton } from "../components/common/StyledButton";

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
    <div className={styles.parentDiv}>
      <h1>ChatApp: Basic Group Messaging Service</h1>
      <div className={styles.linkButtons}>
        <StyledButton
          onClick={() => navigate("/login")}
          className={styles.homeButton}
        >
          Login
        </StyledButton>
        <StyledButton
          onClick={() => navigate("/signup")}
          className={styles.homeButton}
        >
          Sign Up
        </StyledButton>
      </div>
    </div>
  );
}

export default Home;
