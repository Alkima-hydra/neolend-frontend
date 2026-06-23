import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getAllApplications, getScoringExplanation, getCurrentModel } from "../../api/api";
import styles from "../shared.module.css";

function ShapRow({ label, value }) {
  const pos = value >= 0;
  const w   = Math.min(Math.abs(value) * 300, 100);
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
  const [apps, setApps]             = useState([]);
  const [selectedId, setSelectedId] = useState("app1");
  const [explanation, setExplanation] = useState(null);
  const [model, setModel]           = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    getAllApplications().then(setApps);
    getCurrentModel().then(setModel);
  }, []);

  useEffect(() => {
    setLoading(true);
    getScoringExplanation(selectedId).then(setExplanation).catch(() => setExplanation(null)).finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explicación de Scoring</h1>
        <p className={styles.pageSubtitle}>Análisis SHAP del modelo de scoring crediticio — Blue/Green Deployment</p>
      </div>

      {model && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Modelo en producción</h3>
          <div className={styles.grid3}>
            <div className={styles.infoRow} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span className={styles.infoLabel}>Versión</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{model.version}</span>
            </div>
            <div className={styles.infoRow} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span className={styles.infoLabel}>Precisión</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{(model.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.infoRow} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span className={styles.infoLabel}>Estrategia de despliegue</span>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>Blue/Green — {model.active}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Seleccionar solicitud</h3>
        <div className={styles.field}>
          <label>Solicitud a analizar</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — USD {a.requestedAmount} — {a.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className={styles.loading}>Calculando explicación...</div>}

      {explanation && !loading && (
        <>
          <div className={styles.card} style={{ textAlign: "center", paddingBlock: "1.75rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Score calculado</div>
            <div style={{
              fontSize: "4rem", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1,
              color: explanation.riskLevel === "LOW" ? "#16a34a" : explanation.riskLevel === "HIGH" ? "#dc2626" : "#d97706",
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
              {explanation.explanation}
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Variable</th><th>Impacto SHAP</th><th>Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(explanation.shapValues).map(([k, v]) => (
                    <ShapRow key={k} label={k} value={v} />
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
