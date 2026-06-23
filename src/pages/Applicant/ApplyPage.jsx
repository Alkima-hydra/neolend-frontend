import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Calculator } from "lucide-react";
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
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [applicant, setApplicant]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [form, setForm]             = useState({ requestedAmount: "", termMonths: "6", purpose: PURPOSES[0], currency: "USD" });

  useEffect(() => {
    getApplicantByUserId(user.id).then(setApplicant).catch(() => setError("No se encontró perfil")).finally(() => setLoading(false));
  }, [user.id]);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

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

  const amount = parseFloat(form.requestedAmount) || 0;
  const months = parseInt(form.termMonths) || 6;
  const monthly = amount > 0 ? ((amount * (1 + 0.125)) / months).toFixed(2) : null;
  const total   = amount > 0 ? (amount * (1 + 0.125)).toFixed(2) : null;

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Solicitar Crédito</h1>
        <p className={styles.pageSubtitle}>Completa los datos para iniciar tu evaluación crediticia</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Detalle de la solicitud</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Monto solicitado (USD)</label>
              <input type="number" name="requestedAmount" value={form.requestedAmount} onChange={change}
                placeholder="Ej. 450" min="50" max="5000" step="10" required />
            </div>
            <div className={styles.field}>
              <label>Plazo en meses</label>
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

        {monthly && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calculator size={16} /> Estimación de cuotas
            </h3>
            <div className={styles.grid3}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>USD {amount.toFixed(2)}</div>
                <div className={styles.statLabel}>Monto solicitado</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>USD {monthly}</div>
                <div className={styles.statLabel}>Cuota mensual estimada</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>USD {total}</div>
                <div className={styles.statLabel}>Total a pagar</div>
              </div>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Estimación con tasa referencial 12.5% anual. La tasa real se define tras el scoring crediticio.
            </p>
          </div>
        )}

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={submitting || !applicant}>
            <Send size={14} />
            {submitting ? "Enviando solicitud..." : "Enviar solicitud de crédito"}
          </button>
        </div>
      </form>
    </div>
  );
}
