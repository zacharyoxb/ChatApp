import { useEffect } from "react";
import styles from "./Home.module.css";
import { useNavigate } from "react-router";
import { useAuthSession } from "../queries/authQueries";

function Home() {
  const navigate = useNavigate();
  const { data: session } = useAuthSession()

  useEffect(() => {
    if(session) {
      navigate("/chats")
    }
  }, [session, navigate]);

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
