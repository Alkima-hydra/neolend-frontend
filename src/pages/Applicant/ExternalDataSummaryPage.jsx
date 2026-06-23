import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getApplicationsByApplicant, getExternalDataSummary } from "../../api/api";
import styles from "../shared.module.css";

function ScoreBar({ label, value, max = 100 }) {
  const pct   = Math.min((value / max) * 100, 100);
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#d97706" : "#dc2626";
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{label}</span>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>{value}</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ExternalDataSummaryPage() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => getApplicationsByApplicant(a.id))
      .then((apps) => {
        const app = apps.find((a) => ["APPROVED","MANUAL_REVIEW","REJECTED"].includes(a.status)) || apps[0];
        if (!app) throw new Error("Sin solicitudes para mostrar datos externos");
        return getExternalDataSummary(app.id);
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className={styles.loading}>Consultando fuentes externas...</div>;
  if (error)   return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Resumen de Datos Externos</h1>
        <p className={styles.pageSubtitle}>Fuentes de datos alternativos consultadas durante tu evaluación crediticia</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Puntajes por fuente</h3>
        <ScoreBar label="Buró de crédito"      value={data.creditBureauScore}    max={850} />
        <ScoreBar label="Pagos de servicios"   value={data.utilityPaymentScore} />
        <ScoreBar label="Billetera digital"    value={data.walletTransactionScore} />
        <ScoreBar label="E-commerce"           value={data.ecommerceScore} />
        <ScoreBar label="Recargas móviles"     value={data.mobileTopupScore} />
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Buró de crédito</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Fuente</span>
            <span className={styles.infoValue}>{data.bureau.source}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Latencia</span>
            <span className={styles.infoValue}>{data.bureau.latencyMs} ms</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Caché</span>
            <span className={`${styles.badge} ${data.bureau.cacheHit ? styles.badgeGreen : styles.badgeGray}`}>
              {data.bureau.cacheHit ? "HIT" : "MISS"}
            </span>
          </div>
          {data.bureau.circuitBreaker && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Circuit Breaker</span>
              <span className={`${styles.badge} ${styles.badgeYellow}`}>{data.bureau.circuitBreaker}</span>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Servicios públicos</h3>
          {Object.entries(data.utilities).map(([k, v]) => (
            <div className={styles.infoRow} key={k}>
              <span className={styles.infoLabel} style={{ textTransform: "capitalize" }}>{k}</span>
              <span className={`${styles.badge} ${v === "ON_TIME" ? styles.badgeGreen : styles.badgeYellow}`}>{v}</span>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Billetera digital</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Transacciones / mes</span>
            <span className={styles.infoValue}>{data.wallet.monthlyTransactions}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Saldo promedio</span>
            <span className={styles.infoValue}>USD {data.wallet.avgBalance}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>E-commerce</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Órdenes (6 meses)</span>
            <span className={styles.infoValue}>{data.ecommerce.ordersLast6Months}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Contracargos</span>
            <span className={`${styles.badge} ${data.ecommerce.chargebacks === 0 ? styles.badgeGreen : styles.badgeRed}`}>
              {data.ecommerce.chargebacks}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Recargas</span>
            <span className={styles.infoValue}>{data.mobileTopups.frequency} — {data.mobileTopups.consistency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
