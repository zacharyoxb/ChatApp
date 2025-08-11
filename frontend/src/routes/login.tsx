import { useState } from 'react';
import './css/login.css'
import { useNavigate } from "react-router";

function Login() {
const navigate = useNavigate();
const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // prevents page from reloading
    const formData = new FormData(event.currentTarget);

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // api call
    try {
       const response = await fetch('https://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      console.log("Hi?");

      if (response.ok) {
        const data = await response.json();
        // store session id
        localStorage.setItem("session_id", data.session_id)
        navigate("/chats")
      }

      switch (response.status) {
        case 401:
          setError('Username or password is incorrect.');
          break;
        default:
          setError('Unknown error has occurred. Please contact website administrator.')
      }

    } catch (err) {
      setError('Internal Server Error.');
    }
  }

  return (
    <>
      <div id="login-box">
        <h2> Login </h2>
        <form id="entry-area" onSubmit={handleSubmit}> 
          <label>
            Username: <input name="username" required />
          </label>
          <label>
            Password: <input name="password" type="password" required />
          </label>
          {error && <div className="inline-error">{error}</div>}
          <button type="submit">Sign Up</button>
        </form>
      </div>
    </>
  )
}

export default Login
