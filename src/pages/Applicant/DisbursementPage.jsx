import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Building2, Store, Banknote, ArrowRight, CheckCircle } from "lucide-react";
import { getDisbursement, requestDisbursement } from "../../api/api";
import styles from "../shared.module.css";
import dStyles from "./DisbursementPage.module.css";

const CHANNELS = [
  { value: "WALLET",        label: "Billetera digital",          sub: "Tigo Money / Unitel",         Icon: Smartphone },
  { value: "BANK",          label: "Cuenta bancaria",            sub: "Transferencia directa",        Icon: Building2 },
  { value: "CORRESPONDENT", label: "Corresponsal bancario",      sub: "BancoSol, FIE, Prodem",       Icon: Store },
  { value: "CASH",          label: "Efectivo",                   sub: "Retiro en punto autorizado",  Icon: Banknote },
];

const STATUS_CLS = {
  COMPLETED:  styles.badgeGreen,
  PROCESSING: styles.badgeYellow,
  PENDING:    styles.badgeBlue,
  FAILED:     styles.badgeRed,
};

export default function DisbursementPage() {
  const [disbursement, setDisbursement] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [form, setForm]                 = useState({ channel: "WALLET", destination: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [success, setSuccess]           = useState("");
  const [error, setError]               = useState("");

  useEffect(() => {
    getDisbursement("loan1").then(setDisbursement).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleRequest(e) {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await requestDisbursement("loan1", form.channel, form.destination);
      setDisbursement(res);
      setSuccess("Solicitud de desembolso enviada. Se procesará en los próximos minutos.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className={styles.loading}>Consultando desembolso...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Desembolso</h1>
        <p className={styles.pageSubtitle}>Recibe tu crédito aprobado a través del canal de tu preferencia</p>
      </div>

      {disbursement && (
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.125rem" }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Desembolso activo</h3>
            <span className={`${styles.badge} ${STATUS_CLS[disbursement.status] || styles.badgeGray}`}>
              {disbursement.status}
            </span>
          </div>

          <div style={{ padding: "1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: "1.125rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>Monto desembolsado</div>
            <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "#16a34a" }}>USD {disbursement.amount.toLocaleString()}</div>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Canal</span>
            <span className={styles.infoValue}>{disbursement.channel}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cuenta destino</span>
            <span className={styles.infoValue}>{disbursement.destinationAccount}</span>
          </div>
          {disbursement.providerReference && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Referencia</span>
              <code style={{ fontSize: "0.8125rem", color: "#1d4ed8" }}>{disbursement.providerReference}</code>
            </div>
          )}
          {disbursement.completedAt && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Completado</span>
              <span className={styles.infoValue}>{new Date(disbursement.completedAt).toLocaleString()}</span>
            </div>
          )}

          {disbursement.status === "COMPLETED" && (
            <div className={styles.infoBox} style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={15} />
              Crédito desembolsado exitosamente.{" "}
              <Link to="/applicant/loan-status" style={{ color: "#1d4ed8", fontWeight: 600 }}>
                Ver cuotas <ArrowRight size={12} style={{ display: "inline" }} />
              </Link>
            </div>
          )}
        </div>
      )}

      {!disbursement && (
        <form onSubmit={handleRequest}>
          {error   && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Selecciona el canal de desembolso</h3>
            <div className={dStyles.channelGrid}>
              {CHANNELS.map(({ value, label, sub, Icon }) => (
                <label
                  key={value}
                  className={`${dStyles.channelCard} ${form.channel === value ? dStyles.channelCardActive : ""}`}
                >
                  <input
                    type="radio" name="channel" value={value}
                    checked={form.channel === value}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    style={{ display: "none" }}
                  />
                  <Icon size={22} color={form.channel === value ? "#1d4ed8" : "#94a3b8"} />
                  <div>
                    <div className={dStyles.channelLabel}>{label}</div>
                    <div className={dStyles.channelSub}>{sub}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className={styles.field} style={{ marginTop: "1rem" }}>
              <label>Número de cuenta / teléfono</label>
              <input
                type="text" value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Ej. 70000001"
                required
              />
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
