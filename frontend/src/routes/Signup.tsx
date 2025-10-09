import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { StyledButton } from "../components/StyledButton";
import styles from "./css/SharedAuth.module.css";

function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const password = formData.get("password") as string;
    const password2 = formData.get("password2") as string;

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    const username = formData.get("username") as string;
    const remember_me = formData.get("remember-me") === "on";

    try {
      const response = await fetch("https://localhost:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, remember_me }),
        credentials: "include",
      });

      if (response.ok) {
        navigate("/chats");
      }

      switch (response.status) {
        case 409:
          setError("This username is already taken. Try another.");
          break;
        case 500:
          setError("Database error. Please contact website administrator.");
          break;
        default:
          setError(
            "Unknown error has occurred. Please contact website administrator."
          );
      }
    } catch (err) {
      setError(
        "Unknown error has occurred. Please contact website administrator."
      );
    }
  };

  return (
    <div className="parent-div">
      {error && <div className="error-box">{error}</div>}
      <div className={styles.entryBox}>
        <h2> Sign Up </h2>
        <form className={styles.entryArea} onSubmit={handleSubmit}>
          <label>
            Username: <input name="username" required />
          </label>
          <label>
            Password: <input name="password" type="password" required />
          </label>
          <label>
            Enter password again:
            <input name="password2" type="password" required />
          </label>
          <label className={styles.checkboxLabel}>
            <input name="remember-me" type="checkbox"></input>
            Remember me
          </label>
          <StyledButton type="submit">Sign Up</StyledButton>
        </form>

        <div>
          Already have an account? <Link to="/login"> Login </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
