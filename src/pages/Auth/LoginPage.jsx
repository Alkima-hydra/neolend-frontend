import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./LoginPage.module.css";

const ROLE_HOME = {
  SOLICITANTE: "/applicant/profile",
  ANALISTA: "/analyst/review",
  GESTOR_COBRANZA: "/collections/dashboard",
  INVERSIONISTA: "/investor/dashboard",
  REGULADOR: "/regulator/audit",
  COMERCIO: "/applicant/profile",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  function quickLogin(email) {
    setEmail(email);
    setPassword("demo123");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>Neo<span>Lend</span></h1>
          <p>Plataforma de Crédito Digital</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@neolend.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className={styles.footer}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </div>

        <div className={styles.hints}>
          <p>Accesos de demo (contraseña: demo123)</p>
          <ul>
            {[
              ["Solicitante", "juan.solicitante@neolend.com"],
              ["Analista",    "maria.analista@neolend.com"],
              ["Cobranza",    "carlos.cobranza@neolend.com"],
              ["Inversionista","fondo.andino@neolend.com"],
              ["Regulador",   "regulador@superintendencia.gob"],
            ].map(([role, e]) => (
              <li key={e}>
                <button
                  type="button"
                  onClick={() => quickLogin(e)}
                  style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0, fontSize: "0.75rem" }}
                >
                  {role}: {e}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
