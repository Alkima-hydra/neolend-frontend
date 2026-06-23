import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDisbursement, requestDisbursement } from "../../api/api";
import styles from "../shared.module.css";

const CHANNELS = [
  { value: "WALLET",         label: "Billetera digital (Tigo Money / Unitel)",  icon: "📱" },
  { value: "BANK",           label: "Cuenta bancaria",                           icon: "🏦" },
  { value: "CORRESPONDENT",  label: "Corresponsal bancario",                     icon: "🏪" },
  { value: "CASH",           label: "Efectivo",                                  icon: "💵" },
];

const STATUS_COLOR = {
  COMPLETED: styles.badgeGreen,
  PROCESSING: styles.badgeYellow,
  PENDING: styles.badgeBlue,
  FAILED: styles.badgeRed,
};

export default function DisbursementPage() {
  const [disbursement, setDisbursement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ channel: "WALLET", destination: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getDisbursement("loan1").then(setDisbursement).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await requestDisbursement("loan1", form.channel, form.destination);
      setDisbursement(res);
      setSuccess("Solicitud de desembolso enviada. Se procesará en breve.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className={styles.loading}>Consultando desembolso...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Desembolso</h1>
      <p className={styles.pageSubtitle}>Estado y detalles del desembolso de tu crédito aprobado</p>

      {disbursement && (
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Desembolso #{disbursement.id}</h3>
            <span className={`${styles.badge} ${STATUS_COLOR[disbursement.status] || styles.badgeGray}`}>
              {disbursement.status}
            </span>
          </div>
          <div className={styles.grid2}>
            <div className={styles.infoRow} style={{ flexDirection: "column", gap: 2 }}>
              <span className={styles.infoLabel}>Monto</span>
              <span className={styles.infoValue} style={{ fontSize: "1.5rem", color: "#4ade80" }}>
                USD {disbursement.amount.toLocaleString()}
              </span>
            </div>
            <div className={styles.infoRow} style={{ flexDirection: "column", gap: 2 }}>
              <span className={styles.infoLabel}>Canal</span>
              <span className={styles.infoValue}>{disbursement.channel}</span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cuenta destino</span>
            <span className={styles.infoValue}>{disbursement.destinationAccount}</span>
          </div>
          {disbursement.providerReference && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Referencia proveedor</span>
              <span className={styles.infoValue} style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{disbursement.providerReference}</span>
            </div>
          )}
          {disbursement.completedAt && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Completado</span>
              <span className={styles.infoValue}>{new Date(disbursement.completedAt).toLocaleString()}</span>
            </div>
          )}
          {disbursement.status === "COMPLETED" && (
            <div className={styles.success} style={{ marginTop: "0.75rem" }}>
              ✅ Tu crédito fue desembolsado exitosamente.{" "}
              <Link to="/applicant/loan-status" style={{ color: "#4ade80", fontWeight: 600 }}>Ver cuotas →</Link>
            </div>
          )}
        </div>
      )}

      {!disbursement && (
        <form onSubmit={handleRequest}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Selecciona canal de desembolso</h3>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              {CHANNELS.map((ch) => (
                <label key={ch.value} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", padding: "0.75rem", background: form.channel === ch.value ? "#0f2744" : "#0f172a", border: `1px solid ${form.channel === ch.value ? "#38bdf8" : "#334155"}`, borderRadius: 8 }}>
                  <input type="radio" name="channel" value={ch.value} checked={form.channel === ch.value} onChange={(e) => setForm({ ...form, channel: e.target.value })} style={{ accentColor: "#38bdf8" }} />
                  <span style={{ fontSize: "1.25rem" }}>{ch.icon}</span>
                  <span style={{ color: "#e2e8f0", fontSize: "0.875rem" }}>{ch.label}</span>
                </label>
              ))}
            </div>
            <div className={styles.field}>
              <label>Número de cuenta / teléfono</label>
              <input type="text" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="ej. 70000001" required />
            </div>
          </div>
          <div className={styles.btnRow}>
            <button className={styles.btnPrimary} type="submit" disabled={submitting}>
              {submitting ? "Procesando..." : "Solicitar desembolso"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
