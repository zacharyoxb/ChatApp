import './css/login.css'

function Login() {

  return (
    <>
      <div id="login-box">
        <h2> Login </h2>
        <div id="entry-area"> 
          <label>
            Email: <input name="email"/>
          </label>
          <label>
            Password: <input name="password"/>
          </label>
        </div>
      </div>
    </>
  )
}

export default Login
