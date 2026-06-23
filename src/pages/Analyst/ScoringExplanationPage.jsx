import { useState, useEffect } from "react";
import { getAllApplications, getScoringExplanation, getCurrentModel } from "../../api/api";
import styles from "../shared.module.css";

function ShapRow({ label, value }) {
  const abs = Math.abs(value);
  const pos = value >= 0;
  const width = Math.min(abs * 300, 100);
  return (
    <tr>
      <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{label.replace(/_/g, " ")}</td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 120, height: 8, background: "#334155", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${width}%`, background: pos ? "#4ade80" : "#f87171", borderRadius: 9999 }} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: pos ? "#4ade80" : "#f87171", minWidth: 40 }}>
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
  const [selectedId, setSelectedId] = useState("app1");
  const [explanation, setExplanation] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);

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
      <h1 className={styles.pageTitle}>Explicación de Scoring</h1>
      <p className={styles.pageSubtitle}>Análisis SHAP del modelo de scoring crediticio</p>

      {model && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Modelo activo</h3>
          <div className={styles.grid3}>
            <div className={styles.infoRow} style={{ flexDirection: "column" }}>
              <span className={styles.infoLabel}>Versión</span>
              <span className={styles.infoValue}>{model.version}</span>
            </div>
            <div className={styles.infoRow} style={{ flexDirection: "column" }}>
              <span className={styles.infoLabel}>Precisión</span>
              <span className={styles.infoValue}>{(model.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.infoRow} style={{ flexDirection: "column" }}>
              <span className={styles.infoLabel}>Estrategia</span>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>Blue/Green — {model.active}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Seleccionar solicitud</h3>
        <div className={styles.field}>
          <label>Solicitud</label>
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
          <div className={styles.card} style={{ textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Score calculado</div>
            <div style={{
              fontSize: "3.5rem", fontWeight: 800,
              color: explanation.riskLevel === "LOW" ? "#4ade80" : explanation.riskLevel === "HIGH" ? "#f87171" : "#fbbf24"
            }}>
              {explanation.score}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span className={`${styles.badge} ${explanation.riskLevel === "LOW" ? styles.badgeGreen : explanation.riskLevel === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
                Riesgo {explanation.riskLevel}
              </span>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Valores SHAP — Contribución por variable</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
              {explanation.explanation}
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Impacto SHAP</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(explanation.shapValues).map(([k, v]) => (
                  <ShapRow key={k} label={k} value={v} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
