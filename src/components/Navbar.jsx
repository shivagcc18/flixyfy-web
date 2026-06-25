import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        FLIXYFY
      </Link>

      <nav className="navbar-links" aria-label="Primary navigation">
        <NavLink to="/" end>
          Indian
        </NavLink>
        <NavLink to="/hollywood">Hollywood</NavLink>
        <NavLink to="/historical">Historical</NavLink>
      </nav>
    </header>
  );
}