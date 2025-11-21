import { useEffect } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router";
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
        <button
          onClick={() => navigate("/login")}
          className={styles.homeButton}
        >
          Login
        </button>
        <button
          onClick={() => navigate("/signup")}
          className={styles.homeButton}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Home;
