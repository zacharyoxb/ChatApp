import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import styles from "./LoginSignup.module.css";
import { useAuthSession, useLogin } from "../queries/authQueries";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
 
  // Queries
  const { data: session } = useAuthSession()
  const loginMutation = useLogin()

  useEffect(() => {
    if (location.state?.sessionExpired) {
      setError("Your session has expired. Please log in again.");
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.noCookie) {
      setError("You must login before you can access your chats.");
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      if (session) {
        navigate("/chats")
      }
    }
  }, [session, navigate, location]);

  useEffect(() => {
    if (loginMutation.isError && loginMutation.error) {
      setError(loginMutation.error.message);
    }
  }, [loginMutation.isError, loginMutation.error]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const rememberMe = formData.get("remember-me") === "on";

    loginMutation.mutate({
      username,
      password,
      rememberMe,
    })
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

        <button type="submit">Log in</button>
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
