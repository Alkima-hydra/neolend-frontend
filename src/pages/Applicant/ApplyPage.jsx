import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, createApplication } from "../../api/api";
import styles from "../shared.module.css";

const PURPOSES = [
  "Compra de inventario para pequeño negocio",
  "Capital de trabajo para emprendimiento",
  "Compra de equipos o herramientas",
  "Gastos de salud",
  "Educación",
  "Mejoras del hogar",
  "Otro",
];

export default function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ requestedAmount: "", termMonths: "6", purpose: PURPOSES[0], currency: "USD" });

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then(setApplicant)
      .catch(() => setError("No se encontró perfil"))
      .finally(() => setLoading(false));
  }, [user.id]);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const amount = parseFloat(form.requestedAmount);
    if (amount < 50 || amount > 5000) { setError("El monto debe estar entre USD 50 y USD 5,000"); return; }
    setSubmitting(true);
    try {
      const app = await createApplication(applicant.id, {
        requestedAmount: amount,
        termMonths: parseInt(form.termMonths),
        purpose: form.purpose,
        currency: form.currency,
      });
      navigate("/applicant/application-status", { state: { newApp: app } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const monthly = form.requestedAmount
    ? (parseFloat(form.requestedAmount) * (1 + 0.125) / parseInt(form.termMonths)).toFixed(2)
    : "—";

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Solicitar Crédito</h1>
      <p className={styles.pageSubtitle}>Completa los datos para iniciar tu evaluación crediticia</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Detalle de la solicitud</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Monto solicitado (USD)</label>
              <input
                type="number"
                name="requestedAmount"
                value={form.requestedAmount}
                onChange={change}
                placeholder="ej. 450"
                min="50"
                max="5000"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Plazo (meses)</label>
              <select name="termMonths" value={form.termMonths} onChange={change}>
                {[3, 4, 6, 9, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>{m} meses</option>
                ))}
              </select>
            </div>
            <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
              <label>Propósito del crédito</label>
              <select name="purpose" value={form.purpose} onChange={change}>
                {PURPOSES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {form.requestedAmount && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Estimación de cuotas</h3>
            <div className={styles.grid3}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>USD {parseFloat(form.requestedAmount).toFixed(2)}</div>
                <div className={styles.statLabel}>Monto solicitado</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{form.termMonths}</div>
                <div className={styles.statLabel}>Meses de plazo</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>USD {monthly}</div>
                <div className={styles.statLabel}>Cuota estimada/mes</div>
              </div>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0.5rem 0 0" }}>
              * Estimación con tasa referencial 12.5% anual. La tasa real será definida tras el scoring.
            </p>
          </div>
        )}

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={submitting}>
            {submitting ? "Enviando solicitud..." : "Solicitar crédito →"}
          </button>
        </div>
      </form>
    </div>
  );
}
