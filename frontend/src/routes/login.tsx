import './css/login.css'

function Login() {

  return (
    <>
      <div id="login-box">
        <h2> Login </h2>
        <label className='entry-box'>
          Username: <input name="Username input box"/>
        </label>
        <label className='entry-box'>
          Password: <input name="Username input box"/>
        </label>
      </div>
    </>
  )
}

export default Login
