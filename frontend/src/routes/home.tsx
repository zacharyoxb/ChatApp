import { useState } from 'react';
import './css/home.css'
import { Link } from 'react-router';

function Home() {
  const [hovered, setHovered] = useState(false);

  return (
    <div id="parent">
      <h1>ChatApp: Basic Group Messaging Service</h1>
      <div id="link-buttons">
        <Link
          className="link-button"
          to="/login"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            backgroundColor: hovered ? '#333' : '#eee',
            color: hovered ? 'white' : 'black',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            textDecoration: 'none',
            marginRight: '1rem'
          }}
        >
          Login
        </Link>

        <Link className="link-button" to="/signup"
          style={{
            backgroundColor: '#eee',
            color: 'black',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            textDecoration: 'none'
          }}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default Home
