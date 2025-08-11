import { useState } from "react";
import "./css/home.css";
import { Link } from "react-router";

function Home() {
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);

  return (
    <div id="parent">
      <h1>ChatApp: Basic Group Messaging Service</h1>
      <div id="link-buttons">
        <Link
          className="link-button"
          to="/login"
          onMouseEnter={() => setHovered1(true)}
          onMouseLeave={() => setHovered1(false)}
          style={{
            backgroundColor: hovered1 ? "#333" : "#eee",
            color: hovered1 ? "white" : "black",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            textDecoration: "none",
            marginRight: "1rem",
          }}
        >
          Login
        </Link>

        <Link
          className="link-button"
          to="/signup"
          onMouseEnter={() => setHovered2(true)}
          onMouseLeave={() => setHovered2(false)}
          style={{
            backgroundColor: hovered2 ? "#333" : "#eee",
            color: hovered2 ? "white" : "black",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            textDecoration: "none",
            marginRight: "1rem",
          }}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default Home;
