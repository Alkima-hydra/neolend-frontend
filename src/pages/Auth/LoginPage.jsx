import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./LoginPage.module.css";

const ROLE_HOME = {
  SOLICITANTE:     "/applicant/profile",
  ANALISTA:        "/analyst/review",
  GESTOR_COBRANZA: "/collections/dashboard",
  INVERSIONISTA:   "/investor/dashboard",
  REGULADOR:       "/regulator/audit",
  COMERCIO:        "/applicant/profile",
  ADMIN:           "/admin/users",
};


const DEMO_USERS = [
  { role: "Solicitante",  email: "juan.solicitante@neolend.com" },
  { role: "Analista",     email: "maria.analista@neolend.com" },
  { role: "Cobranza",     email: "carlos.cobranza@neolend.com" },
  { role: "Inversionista",email: "fondo.andino@neolend.com" },
  { role: "Regulador",    email: "regulador@superintendencia.gob" },
  { role: "Admin",        email: "admin@neolend.com" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(e) {
    setEmail(e);
    setPassword("demo123");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <Landmark size={24} color="#fff" />
          </div>
          <h1>Neo<span>Lend</span></h1>
          <p>Plataforma de Crédito Digital</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@neolend.com" required autoFocus />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className={styles.footer}>
          Sin cuenta? <Link to="/register">Regístrate aquí</Link>
        </div>

        <div className={styles.divider}>accesos demo</div>

        <div className={styles.hints}>
          <div className={styles.hintsTitle}>Usuarios de prueba — contraseña: demo123</div>
          {DEMO_USERS.map(({ role, email: e }) => (
            <div className={styles.hintItem} key={e}>
              <span className={styles.hintRole}>{role}</span>
              <span style={{ color: "#94a3b8", fontSize: "0.7rem", flex: 1 }}>{e}</span>
              <button type="button" className={styles.quickBtn} onClick={() => quickLogin(e)}>
                Usar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
