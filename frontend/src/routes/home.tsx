import './home.css'
import { Link } from 'react-router';

function Home() {

  return (
    <div id='parent'>
      <h1>
        ChatApp: Basic Group Messaging Service
      </h1>
      <div className='Buttons'>
        <Link className='button-link' to="/login">
          Login
        </Link>

        <Link className='button-link' to="/signup">
          Sign Up
        </Link>
      </div>
    </div>
  )
}

export default Home
