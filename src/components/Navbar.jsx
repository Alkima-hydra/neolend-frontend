import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
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
        Neo<span className={styles.brandDot}>Lend</span>
      </Link>
      {user && (
        <div className={styles.right}>
          <span className={styles.userName}>{user.fullName}</span>
          <span className={styles.roleBadge}>{user.role.replace("_", " ")}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} />
            Salir
          </button>
        </div>
      )}
    </nav>
  );
}
