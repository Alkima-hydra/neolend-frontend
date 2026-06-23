import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getApplicationsByApplicant, getScoringResult, getDecision } from "../../api/api";
import styles from "../shared.module.css";

const RISK_COLOR = { LOW: "#4ade80", MEDIUM: "#fbbf24", HIGH: "#f87171" };
const DECISION_COLOR = { APPROVED: styles.badgeGreen, REJECTED: styles.badgeRed, MANUAL_REVIEW: styles.badgeYellow };

function ShapBar({ label, value }) {
  const absVal = Math.abs(value);
  const isPositive = value >= 0;
  const width = Math.min(absVal * 200, 100);
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{label.replace(/_/g, " ")}</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isPositive ? "#4ade80" : "#f87171" }}>
          {isPositive ? "+" : ""}{value.toFixed(2)}
        </span>
      </div>
      <div style={{ height: 8, background: "#334155", borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: isPositive ? "#4ade80" : "#f87171", borderRadius: 9999 }} />
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { user } = useAuth();
  const [scoring, setScoring] = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => getApplicationsByApplicant(a.id))
      .then(async (apps) => {
        const app = apps.find((a) => ["APPROVED","REJECTED","MANUAL_REVIEW"].includes(a.status)) || apps[0];
        if (!app) throw new Error("Sin solicitudes evaluadas");
        const [sc, dec] = await Promise.all([getScoringResult(app.id), getDecision(app.id)]);
        setScoring(sc);
        setDecision(dec);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className={styles.loading}>Obteniendo resultado...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const riskColor = RISK_COLOR[scoring?.riskLevel] || "#94a3b8";

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Resultado de Evaluación</h1>
      <p className={styles.pageSubtitle}>Resultado del scoring crediticio y decisión de aprobación</p>

      <div className={styles.card} style={{ textAlign: "center" }}>
        <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Score crediticio</div>
        <div style={{ fontSize: "4rem", fontWeight: 800, color: riskColor, lineHeight: 1 }}>
          {scoring?.score}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <span className={`${styles.badge} ${scoring?.riskLevel === "LOW" ? styles.badgeGreen : scoring?.riskLevel === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
            Riesgo {scoring?.riskLevel}
          </span>
          <span className={`${styles.badge} ${DECISION_COLOR[decision?.decision] || styles.badgeGray}`}>
            {decision?.decision}
          </span>
          <span className={styles.badge} style={{ background: "#1e293b", color: "#64748b", border: "1px solid #334155" }}>
            {scoring?.modelVersion}
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Decisión</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tipo</span>
            <span className={styles.infoValue}>{decision?.decisionType}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Razón</span>
            <span className={styles.infoValue} style={{ maxWidth: "55%", textAlign: "right", fontSize: "0.8rem", color: "#94a3b8" }}>{decision?.reason}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tiempo de procesamiento</span>
            <span className={styles.infoValue}>{(scoring?.processingTimeMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Explicación SHAP</h3>
          <p style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.75rem" }}>
            Contribución de cada variable al score final (+positivo / -negativo)
          </p>
          {scoring?.shapValues && Object.entries(scoring.shapValues).map(([k, v]) => (
            <ShapBar key={k} label={k} value={v} />
          ))}
        </div>
      </div>

      {decision?.decision === "APPROVED" && (
        <div className={styles.btnRow}>
          <Link to="/applicant/disbursement" style={{ textDecoration: "none" }}>
            <button className={styles.btnSuccess}>Ver desembolso →</button>
          </Link>
        </div>
      )}
    </div>
  );
}
