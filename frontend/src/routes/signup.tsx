import { useState } from 'react';
import './css/signup.css'

function SignUp() {
const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // prevents page from reloading
    const formData = new FormData(event.currentTarget);

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    setError(null); // clears previous errors

    // api call here
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
            {error && <span className="inline-error">{error}</span>}
          </label>

          <button type="submit">Sign Up</button>
        </form>
      </div>
    </>
  )
}

export default SignUp
