import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.brand}>
        Neo<span>Lend</span>
      </Link>
      {user && (
        <div className={styles.right}>
          <span className={styles.userName}>{user.fullName}</span>
          <span className={styles.roleBadge}>{user.role}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Salir</button>
        </div>
      )}
    </nav>
  );
}
