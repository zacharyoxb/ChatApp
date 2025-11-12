import { useEffect } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router";
import { StyledButton } from "../components/common/StyledButton";
import { useSession } from "../hooks/common/useSession";

function Home() {
  const navigate = useNavigate();
  const session = useSession();

  useEffect(() => {
    const checkSession = async () => {
      let valid = await session.isValidSession();
      if (valid) {
        navigate("/chats");
      }
    };
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
