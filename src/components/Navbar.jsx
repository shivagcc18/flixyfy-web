import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const goHome = (event) => {
    event.preventDefault();

    if (location.pathname === "/") {
      window.location.assign("/");
      return;
    }

    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={goHome}>
        FLIXYFY
      </Link>

      <nav className="navbar-links" aria-label="Primary navigation">
        <NavLink to="/" end>
          Indian
        </NavLink>
        <NavLink to="/historical">Historical</NavLink>
        <NavLink to="/hollywood">Global</NavLink>
      </nav>
    </header>
  );
}
