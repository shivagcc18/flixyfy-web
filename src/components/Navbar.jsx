import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        FLIXYFY
      </Link>
    </header>
  );
}