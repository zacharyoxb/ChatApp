import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { StyledButton } from "../components/StyledButton";
import "./css/signup-login.css";

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

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const password2 = formData.get("password2") as string;

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("https://localhost:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
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
      <div className="login-box">
        <h2> Sign Up </h2>
        <form className="entry-area" onSubmit={handleSubmit}>
          <label>
            Username: <input name="username" required />
          </label>
          <label>
            Password: <input name="password" type="password" required />
          </label>
          <label>
            Enter password again:
            <input name="password2" type="password" required />
            {error && <div className="error-box">{error}</div>}
          </label>

          <StyledButton type="submit">Sign Up</StyledButton>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
