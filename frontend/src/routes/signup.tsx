import './css/signup.css'

function SignUp() {

  return (
    <>
      <div id="login-box">
        <h2> Sign Up </h2>
        <div id="entry-area"> 
          <label>
            Email: <input name="email"/>
          </label>
          <label>
            Password: <input name="password"/>
          </label>
          <label>
            Enter password again: <input name="password 2"/>
          </label>
        </div>
      </div>
    </>
  )
}

export default SignUp
