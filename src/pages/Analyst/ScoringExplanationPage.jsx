import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Loader2, GitCompare, Gauge, Activity } from "lucide-react";
import {
  listApplications, getScoringExplanation, getCurrentModel,
  switchModel, evaluateScoring, getCircuitBreakerStatus,
} from "../../api/scoringApi";
import styles from "../shared.module.css";

const RISK_COLOR = { LOW: "#16a34a", MEDIUM: "#d97706", HIGH: "#dc2626" };
const CIRCUIT_CLS = { CLOSED: "badgeGreen", HALF_OPEN: "badgeYellow", OPEN: "badgeRed" };

function Spinner({ label }) {
  return (
    <div className={styles.loading}>
      <Loader2 size={16} className={styles.spin} /> {label}
    </div>
  );
}

function ShapRow({ label, value }) {
  const pos = value >= 0;
  const w = Math.min(Math.abs(value) * 300, 100);
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {pos ? <TrendingUp size={13} color="#16a34a" /> : <TrendingDown size={13} color="#dc2626" />}
          <span style={{ color: "#475569" }}>{label.replace(/_/g, " ")}</span>
        </div>
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 120, height: 7, background: "#e2e8f0", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${w}%`, background: pos ? "#16a34a" : "#dc2626", borderRadius: 9999 }} />
          </div>
          <span style={{ fontWeight: 700, color: pos ? "#16a34a" : "#dc2626", minWidth: 45, fontSize: "0.8125rem" }}>
            {pos ? "+" : ""}{value.toFixed(3)}
          </span>
        </div>
      </td>
      <td>
        <span className={`${styles.badge} ${pos ? styles.badgeGreen : styles.badgeRed}`}>
          {pos ? "Positivo" : "Negativo"}
        </span>
      </td>
    </tr>
  );
}

export default function ScoringExplanationPage() {
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [explanation, setExplanation] = useState(null);
  const [model, setModel] = useState(null);
  const [circuit, setCircuit] = useState(null);

  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadModel = useCallback(() => {
    getCurrentModel().then(setModel).catch((e) => setError(e.message));
    getCircuitBreakerStatus().then(setCircuit).catch(() => {});
  }, []);

  useEffect(() => {
    loadModel();
    listApplications({ limit: 50 })
      .then((list) => {
        setApps(list);
        if (list.length > 0) setSelectedId(list[0].application_id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingApps(false));
  }, [loadModel]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingExplanation(true);
    setExplanation(null);
    setNotice("");
    getScoringExplanation(selectedId)
      .then(setExplanation)
      .catch((e) => setNotice(e.message))
      .finally(() => setLoadingExplanation(false));
  }, [selectedId]);

  async function handleGenerateScore() {
    const app = apps.find((a) => a.application_id === selectedId);
    if (!app) return;
    setEvaluating(true);
    setError("");
    try {
      await evaluateScoring(app.application_id, app.applicant_id, Number(app.requested_amount));
      const exp = await getScoringExplanation(selectedId);
      setExplanation(exp);
      setNotice("");
    } catch (e) {
      setError(e.message);
    } finally {
      setEvaluating(false);
    }
  }

  async function handleSwitchModel() {
    if (!model) return;
    setSwitching(true);
    setError("");
    try {
      await switchModel(model.standbyModel);
      loadModel();
    } catch (e) {
      setError(e.message);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explicación de Scoring</h1>
        <p className={styles.pageSubtitle}>Análisis SHAP del modelo de scoring crediticio — Blue/Green Deployment</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {model && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <GitCompare size={15} /> Modelo en producción
          </h3>
          <div className={styles.grid3}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className={styles.infoLabel}>Activo</span>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{model.activeModel}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className={styles.infoLabel}>Standby</span>
              <span style={{ fontWeight: 600, color: "#64748b" }}>{model.standbyModel}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className={styles.infoLabel}>Estrategia</span>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>{model.strategy}</span>
            </div>
          </div>
          <div className={styles.btnRow}>
            <button className={styles.btnSecondary} onClick={handleSwitchModel} disabled={switching}>
              {switching ? <Loader2 size={14} className={styles.spin} /> : <GitCompare size={14} />}
              {switching ? "Cambiando..." : `Cambiar a ${model.standbyModel} (sin downtime)`}
            </button>
          </div>
          {circuit && (
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Activity size={13} color="#94a3b8" />
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Circuit breaker buró de crédito:</span>
              <span className={`${styles.badge} ${styles[CIRCUIT_CLS[circuit.state]] || styles.badgeGray}`}>{circuit.state}</span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{circuit.cachedKeys} claves en caché</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Seleccionar solicitud</h3>
        {loadingApps ? (
          <Spinner label="Cargando solicitudes..." />
        ) : apps.length === 0 ? (
          <div className={styles.emptyState}>No hay solicitudes registradas todavía.</div>
        ) : (
          <div className={styles.field}>
            <label>Solicitud a analizar</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {apps.map((a) => (
                <option key={a.application_id} value={a.application_id}>
                  {a.application_id.slice(0, 8)}… — USD {Number(a.requested_amount).toLocaleString()} — {a.status}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingExplanation && <Spinner label="Calculando explicación..." />}

      {!loadingExplanation && notice && (
        <div className={styles.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{notice}</span>
            <button className={styles.btnPrimary} onClick={handleGenerateScore} disabled={evaluating}>
              {evaluating ? <Loader2 size={14} className={styles.spin} /> : <Gauge size={14} />}
              {evaluating ? "Calculando score..." : "Generar score ahora"}
            </button>
          </div>
        </div>
      )}

      {explanation && !loadingExplanation && (
        <>
          <div className={styles.card} style={{ textAlign: "center", paddingBlock: "1.75rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Score calculado</div>
            <div style={{
              fontSize: "4rem", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1,
              color: RISK_COLOR[explanation.riskLevel] || "#64748b",
            }}>{explanation.score}</div>
            <div style={{ marginTop: "0.875rem" }}>
              <span className={`${styles.badge} ${explanation.riskLevel === "LOW" ? styles.badgeGreen : explanation.riskLevel === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
                Riesgo {explanation.riskLevel}
              </span>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Valores SHAP — Contribución por variable</h3>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "1rem" }}>
              Contribución relativa de cada fuente de datos alternativa al score final. Valores positivos suman, negativos restan.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Variable</th><th>Impacto SHAP</th><th>Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  {explanation.explanation.map((row) => (
                    <ShapRow key={row.factor} label={row.factor} value={row.impact} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
