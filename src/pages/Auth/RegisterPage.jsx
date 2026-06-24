import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./RegisterPage.module.css";

const FIELDS = [
  { name: "fullName", label: "Nombre completo",     type: "text",     placeholder: "Juan Pérez" },
  { name: "email",    label: "Correo electrónico",   type: "email",    placeholder: "juan@correo.com" },
  { name: "password", label: "Contraseña",           type: "password", placeholder: "Mínimo 12 caracteres, mayúscula, número y símbolo" },
  { name: "confirm",  label: "Confirmar contraseña", type: "password", placeholder: "Repite la contraseña" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await register(form.fullName, form.email, form.password);
      setSuccess(res.msg);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>
          <h2>Crear cuenta</h2>
          <p>Acceso como solicitante de crédito</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {FIELDS.map((f) => (
            <div className={styles.field} key={f.name}>
              <label>{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={change}
                placeholder={f.placeholder}
                required
              />
            </div>
          ))}
          {error   && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <div className={styles.footer}>
          Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}