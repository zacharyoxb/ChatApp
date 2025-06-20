import './css/signup.css'

function SignUp() {

  return (
    <>
      <div id="signup-box">
        <h2> Sign Up </h2>
        <label className='entry-box'>
          Email: <input name="Email input box"/>
        </label>
        <label className='entry-box'>
          Password: <input name="First password input box"/>
        </label>
        <label className='entry-box'>
          Enter password again: <input name="First password input box"/>
        </label>
      </div>
    </>
  )
}

export default SignUp
