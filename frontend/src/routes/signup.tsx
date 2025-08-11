import { useState } from 'react';
import './css/signup.css'

function SignUp() {
const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // prevents page from reloading
    const formData = new FormData(event.currentTarget);

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    // api call
    try {
       const response = await fetch('https://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (response.ok) {
        // TODO: client gets cookie, redirected to chats
        return;
      }

      switch (response.status) {
        case 400:
          setError('This username is already taken. Try another.');
          break;
        case 500:
          setError('Database error. Please contact website administrator.');
          break;
        default:
          setError('Unknown error has occurred. Please contact website administrator.')
      }

    } catch (err) {
      setError('Unable to reach server. Please check your connection.');
    }
  }

  return (
    <>
      <div id="login-box">
        <h2> Sign Up </h2>
        <form id="entry-area" onSubmit={handleSubmit}> 
          <label>
            Username: <input name="username" required />
          </label>
          <label>
            Password: <input name="password" type="password" required />
          </label>
          <label>
            Enter password again:
            <input name="password2" type="password" required />
            {error && <div className="inline-error">{error}</div>}
          </label>

          <button type="submit">Sign Up</button>
        </form>
      </div>
    </>
  )
}

export default SignUp
