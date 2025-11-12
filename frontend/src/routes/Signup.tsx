import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { StyledButton } from "../components/common/StyledButton";
import styles from "./LoginSignup.module.css";
import { useSession } from "../hooks/common/useSession";

function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const session = useSession();

  useEffect(() => {
    const checkSession = async () => {
      await session.isValidSession();
      if (session.isSuccess) {
        navigate("/chats");
      }
    };
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
    const rememberMe = formData.get("remember-me") === "on";

    try {
      const response = await fetch("https://localhost:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: "include",
      });

      if (response.ok) {
        sessionStorage.setItem("currentUser", username);
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

  const clearError = () => {
    if (error) setError(null);
  };

  return (
    <div className={styles.entryBox}>
      <h1> Sign Up </h1>

      {error && (
        <div
          className="error-box"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {error}
        </div>
      )}

      <form className={styles.entryArea} onSubmit={handleSubmit}>
        <label htmlFor="username-input">
          Username:{" "}
          <input
            id="username-input"
            name="username"
            type="text"
            autoComplete="username"
            required
            aria-required="true"
            onChange={clearError}
          />
        </label>

        <label htmlFor="password-input">
          Password:{" "}
          <input
            id="password-input"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            onChange={clearError}
          />
        </label>

        <label htmlFor="password2-input">
          Enter password again:{" "}
          <input
            id="password2-input"
            name="password2"
            type="password"
            autoComplete="new-password"
            required
            aria-required="true"
            onChange={clearError}
          />
        </label>

        <label htmlFor="remember-me-input" className={styles.checkboxLabel}>
          <input
            id="remember-me-input"
            name="remember-me"
            type="checkbox"
          ></input>
          Remember me
        </label>

        <StyledButton type="submit">Sign Up</StyledButton>
      </form>

      <div>
        Already have an account?{" "}
        <Link to="/login">
          Login
          <span className="sr-only"> to your existing account</span>
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
