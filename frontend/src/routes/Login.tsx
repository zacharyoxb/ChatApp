import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { StyledButton } from "../components/StyledButton";
import styles from "./css/SharedAuth.module.css";

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // Notifies when navigating from expired session
  const location = useLocation();

  useEffect(() => {
    async function checkSession() {
      if (location.state?.sessionExpired) {
        setError("Your session has expired. Please log in again.");
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

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

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const remember_me = formData.get("remember-me") === "on";

    try {
      const response = await fetch("https://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, remember_me }),
        credentials: "include",
      });

      if (response.ok) {
        sessionStorage.setItem("currentUser", username);
        navigate("/chats");
      }

      switch (response.status) {
        case 401:
          setError("Username or password is incorrect.");
          break;
        default:
          setError(
            "Unknown error has occurred. Please contact website administrator."
          );
      }
    } catch (err) {
      setError("Internal Server Error.");
    }
  };

  const clearError = () => {
    if (error) setError(null);
  };

  return (
    <div className={styles.entryBox} role="main">
      <h1> Login </h1>

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
            autoComplete="current-password"
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

        <StyledButton type="submit">Log in</StyledButton>
      </form>

      <div>
        Don't have an account?{" "}
        <Link to="/signup">
          Sign up
          <span className="sr-only"> for a new account</span>
        </Link>
      </div>
    </div>
  );
}

export default Login;
