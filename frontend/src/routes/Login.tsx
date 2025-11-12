import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { StyledButton } from "../components/common/StyledButton";
import styles from "./LoginSignup.module.css";
import { useSession } from "../hooks/common/useSession";

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const session = useSession();

  useEffect(() => {
    const checkSession = async () => {
      let valid = await session.isValidSession();
      if (valid) {
        navigate("/chats");
      }
    };
    if (location.state?.sessionExpired) {
      setError("Your session has expired. Please log in again.");
      navigate(location.pathname, { replace: true, state: {} });
      return;
    } else {
      checkSession();
    }
  }, [navigate, location]);

  useEffect(() => {
    if (session.isError && session.error) {
      setError(session.error);
    }
  }, [session.isError, session.error]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const remember_me = formData.get("remember-me") === "on";

    await session.login(username, password, remember_me);
  };

  const clearError = () => {
    if (session.isError) session.reset();
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
