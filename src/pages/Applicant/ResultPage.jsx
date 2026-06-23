import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getApplicationsByApplicant, getScoringResult, getDecision } from "../../api/api";
import styles from "../shared.module.css";

const RISK_COLOR   = { LOW: "#16a34a", MEDIUM: "#d97706", HIGH: "#dc2626" };
const DECISION_CLS = { APPROVED: styles.badgeGreen, REJECTED: styles.badgeRed, MANUAL_REVIEW: styles.badgeYellow };

function ShapRow({ label, value }) {
  const pos   = value >= 0;
  const width = Math.min(Math.abs(value) * 200, 100);
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {pos ? <TrendingUp size={13} color="#16a34a" /> : <TrendingDown size={13} color="#dc2626" />}
          <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{label.replace(/_/g, " ")}</span>
        </div>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: pos ? "#16a34a" : "#dc2626" }}>
          {pos ? "+" : ""}{value.toFixed(3)}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${width}%`, background: pos ? "#16a34a" : "#dc2626" }} />
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { user } = useAuth();
  const [scoring, setScoring]   = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => getApplicationsByApplicant(a.id))
      .then(async (apps) => {
        const app = apps.find((a) => ["APPROVED","REJECTED","MANUAL_REVIEW"].includes(a.status)) || apps[0];
        if (!app) throw new Error("Sin solicitudes evaluadas");
        const [sc, dec] = await Promise.all([getScoringResult(app.id), getDecision(app.id)]);
        setScoring(sc); setDecision(dec);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className={styles.loading}>Obteniendo resultado...</div>;
  if (error)   return <div className={styles.error}>{error}</div>;

  const riskColor = RISK_COLOR[scoring?.riskLevel] || "#64748b";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Resultado de Evaluación</h1>
        <p className={styles.pageSubtitle}>Score crediticio, decisión de aprobación y explicabilidad SHAP</p>
      </div>

      <div className={styles.card} style={{ textAlign: "center", paddingBlock: "2rem" }}>
        <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 500 }}>Score crediticio</div>
        <div style={{ fontSize: "4.5rem", fontWeight: 800, color: riskColor, lineHeight: 1, letterSpacing: "-2px" }}>
          {scoring?.score}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.625rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <span className={`${styles.badge} ${scoring?.riskLevel === "LOW" ? styles.badgeGreen : scoring?.riskLevel === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
            Riesgo {scoring?.riskLevel}
          </span>
          <span className={`${styles.badge} ${DECISION_CLS[decision?.decision] || styles.badgeGray}`}>
            {decision?.decision}
          </span>
          <span className={`${styles.badge} ${styles.badgeBlue}`}>
            {scoring?.modelVersion}
          </span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Detalle de la decisión</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tipo de decisión</span>
            <span className={styles.infoValue}>{decision?.decisionType}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tiempo de procesamiento</span>
            <span className={styles.infoValue}>{scoring ? (scoring.processingTimeMs / 1000).toFixed(1) + "s" : "—"}</span>
          </div>
          <div style={{ marginTop: "0.875rem", padding: "0.875rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>RAZÓN</div>
            <div style={{ fontSize: "0.875rem", color: "#374151" }}>{decision?.reason}</div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Explicación SHAP</h3>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1rem", lineHeight: 1.5 }}>
            Contribución de cada variable al score. Valores positivos suman, negativos restan.
          </p>
          {scoring?.shapValues && Object.entries(scoring.shapValues).map(([k, v]) => (
            <ShapRow key={k} label={k} value={v} />
          ))}
        </div>
      </div>

      {decision?.decision === "APPROVED" && (
        <div className={styles.btnRow}>
          <Link to="/applicant/disbursement">
            <button className={styles.btnSuccess}>
              Continuar al desembolso <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
