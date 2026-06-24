import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, TrendingDown, Loader2, Gauge, UserX, FileQuestion } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { listApplicants, listApplications, getApplicationDetail, evaluateScoring } from "../../api/scoringApi";
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

function Spinner({ label }) {
  return (
    <div className={styles.loading}>
      <Loader2 size={16} className={styles.spin} /> {label}
    </div>
  );
}

export default function ResultPage() {
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [applicantId, setApplicantId] = useState(null);

  const [loading, setLoading]       = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError]           = useState("");
  const [notFound, setNotFound]     = useState(null); // "profile" | "application" | null

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(null);
    try {
      const applicants = await listApplicants({ userId: user.id, limit: 1 });
      const applicant = applicants[0];
      if (!applicant) { setNotFound("profile"); return; }
      setApplicantId(applicant.id);

      const apps = await listApplications({ applicantId: applicant.id, limit: 1 });
      const app = apps[0];
      if (!app) { setNotFound("application"); return; }
      setApplicationId(app.application_id);

      const d = await getApplicationDetail(app.application_id);
      setDetail(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function handleEvaluate() {
    setEvaluating(true);
    setError("");
    try {
      await evaluateScoring(applicationId, applicantId, Number(detail?.application?.requested_amount));
      const d = await getApplicationDetail(applicationId);
      setDetail(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) return <Spinner label="Obteniendo resultado..." />;

  if (notFound === "profile") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <UserX size={28} />
            <p>Aún no tienes un perfil de solicitante creado.</p>
            <Link to="/applicant/profile"><button className={styles.btnPrimary}>Completar mi perfil</button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (notFound === "application") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <FileQuestion size={28} />
            <p>Todavía no tienes ninguna solicitud de crédito registrada.</p>
            <Link to="/applicant/apply"><button className={styles.btnPrimary}>Solicitar un crédito</button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className={styles.error}>{error}</div>;

  const { scoring, decision, application } = detail || {};
  const riskColor = RISK_COLOR[scoring?.risk_level] || "#64748b";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Resultado de Evaluación</h1>
        <p className={styles.pageSubtitle}>Score crediticio, decisión de aprobación y explicabilidad SHAP</p>
      </div>

      {!scoring ? (
        <div className={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Tu solicitud de USD {Number(application?.requested_amount).toLocaleString()} todavía no fue evaluada.
            </span>
            <button className={styles.btnPrimary} onClick={handleEvaluate} disabled={evaluating}>
              {evaluating ? <Loader2 size={14} className={styles.spin} /> : <Gauge size={14} />}
              {evaluating ? "Calculando score..." : "Evaluar mi solicitud"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.card} style={{ textAlign: "center", paddingBlock: "2rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 500 }}>Score crediticio</div>
            <div style={{ fontSize: "4.5rem", fontWeight: 800, color: riskColor, lineHeight: 1, letterSpacing: "-2px" }}>
              {scoring.score}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.625rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <span className={`${styles.badge} ${scoring.risk_level === "LOW" ? styles.badgeGreen : scoring.risk_level === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
                Riesgo {scoring.risk_level}
              </span>
              {decision && (
                <span className={`${styles.badge} ${DECISION_CLS[decision.decision] || styles.badgeGray}`}>
                  {decision.decision}
                </span>
              )}
              <span className={`${styles.badge} ${styles.badgeBlue}`}>
                {scoring.model_version}
              </span>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Detalle de la decisión</h3>
              {decision ? (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Tipo de decisión</span>
                    <span className={styles.infoValue}>{decision.decision_type}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Tiempo de procesamiento</span>
                    <span className={styles.infoValue}>{(scoring.processing_time_ms / 1000).toFixed(1)}s</span>
                  </div>
                  <div style={{ marginTop: "0.875rem", padding: "0.875rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>RAZÓN</div>
                    <div style={{ fontSize: "0.875rem", color: "#374151" }}>{decision.reason}</div>
                  </div>
                </>
              ) : (
                <div className={styles.infoBox}>Tu solicitud está pendiente de una decisión de aprobación.</div>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Explicación SHAP</h3>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1rem", lineHeight: 1.5 }}>
                Contribución de cada variable al score. Valores positivos suman, negativos restan.
              </p>
              {scoring.shap_values && Object.entries(scoring.shap_values).map(([k, v]) => (
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
        </>
      )}
    </div>
  );
}
