import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Calculator } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createCreditApplication, patchCreditApplicationStatus } from "../../api/api";
import styles from "../shared.module.css";

const PURPOSES = [
  "Capital de trabajo",
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [form, setForm]             = useState({
    requestedAmount: "",
    termMonths: "6",
    purpose: PURPOSES[0],
    currency: "USD",
  });

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const amount = parseFloat(form.requestedAmount);
    if (!amount || amount < 1 || amount > 1_000_000) {
      setError("El monto debe estar entre USD 1 y USD 1,000,000");
      return;
    }
    const months = parseInt(form.termMonths);
    if (!months || months < 1 || months > 360) {
      setError("El plazo debe estar entre 1 y 360 meses");
      return;
    }
    setSubmitting(true);
    try {
      const app = await createCreditApplication({
        applicant_id:     user.id,
        requested_amount: amount,
        currency:         form.currency,
        term_months:      months,
        purpose:          form.purpose || undefined,
      });
      // fire-and-forget: avanza estado en segundo plano
      patchCreditApplicationStatus(app.id, "DATA_COLLECTING").catch(() => {});
      navigate(`/applicant/application-status?id=${app.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const amount  = parseFloat(form.requestedAmount) || 0;
  const months  = parseInt(form.termMonths) || 6;
  const monthly = amount > 0 ? ((amount * (1 + 0.125)) / months).toFixed(2) : null;
  const total   = amount > 0 ? (amount * (1 + 0.125)).toFixed(2) : null;

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
              <input
                type="number" name="requestedAmount" value={form.requestedAmount}
                onChange={change} placeholder="Ej. 350" min="1" max="1000000" step="1" required
              />
            </div>
            <div className={styles.field}>
              <label>Plazo en meses</label>
              <select name="termMonths" value={form.termMonths} onChange={change}>
                {[3, 4, 6, 9, 12, 18, 24, 36, 48, 60].map((m) => (
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
                <div className={styles.statValue}>USD {amount.toLocaleString()}</div>
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
          <button className={styles.btnPrimary} type="submit" disabled={submitting}>
            <Send size={14} />
            {submitting ? "Enviando solicitud..." : "Enviar solicitud de crédito"}
          </button>
        </div>
      </form>
    </div>
  );
}
