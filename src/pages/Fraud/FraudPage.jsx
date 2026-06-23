import { useState, useEffect } from "react";
import { getAllFraudChecks } from "../../api/api";
import styles from "../shared.module.css";

const RISK_COLOR = { LOW: styles.badgeGreen, MEDIUM: styles.badgeYellow, HIGH: styles.badgeRed };

function ScoreMeter({ value, label }) {
  const color = value >= 90 ? "#4ade80" : value >= 75 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value.toFixed(1)}%</div>
      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{label}</div>
    </div>
  );
}

export default function FraudPage() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAllFraudChecks().then(setChecks).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Cargando análisis de fraude...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1000 }}>
      <h1 className={styles.pageTitle}>Detección de Fraude</h1>
      <p className={styles.pageSubtitle}>Resultados de validación biométrica y documental por solicitud</p>

      <div className={styles.card}>
        <div style={{ background: "#0f1a2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#60a5fa" }}>
          🔒 Los datos biométricos son procesados localmente y no salen del país. Cumplimiento GDPR / Ley 1582.
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Solicitud</th><th>Propósito</th><th>Doc. Match</th><th>Biometría</th><th>Identidad robada</th><th>Patrón sospechoso</th><th>Nivel riesgo</th><th></th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{c.applicationId}</td>
                <td style={{ fontSize: "0.8rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.purpose}</td>
                <td>
                  <span style={{ color: c.documentMatchScore >= 90 ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                    {c.documentMatchScore}%
                  </span>
                </td>
                <td>
                  <span style={{ color: c.biometricMatchScore >= 90 ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                    {c.biometricMatchScore}%
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${c.stolenIdentityMatch ? styles.badgeRed : styles.badgeGreen}`}>
                    {c.stolenIdentityMatch ? "SÍ" : "No"}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${c.suspiciousPattern ? styles.badgeRed : styles.badgeGreen}`}>
                    {c.suspiciousPattern ? "SÍ" : "No"}
                  </span>
                </td>
                <td><span className={`${styles.badge} ${RISK_COLOR[c.fraudRiskLevel]}`}>{c.fraudRiskLevel}</span></td>
                <td>
                  <button className={styles.btnSecondary} style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => setSelected(c)}>
                    Ver →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Detalle: {selected.applicationId}</h3>
            <button className={styles.btnSecondary} style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => setSelected(null)}>Cerrar</button>
          </div>
          <div className={styles.grid3} style={{ marginBottom: "1rem" }}>
            <ScoreMeter value={selected.documentMatchScore}  label="Coincidencia documental" />
            <ScoreMeter value={selected.biometricMatchScore} label="Coincidencia biométrica" />
            <div style={{ textAlign: "center" }}>
              <span className={`${styles.badge} ${RISK_COLOR[selected.fraudRiskLevel]}`} style={{ fontSize: "0.9rem", padding: "6px 16px" }}>
                {selected.fraudRiskLevel}
              </span>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 6 }}>Riesgo de fraude</div>
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Identidad robada detectada</span>
              <span className={`${styles.badge} ${selected.stolenIdentityMatch ? styles.badgeRed : styles.badgeGreen}`}>
                {selected.stolenIdentityMatch ? "SÍ — ALERTA" : "No"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Patrón sospechoso</span>
              <span className={`${styles.badge} ${selected.suspiciousPattern ? styles.badgeYellow : styles.badgeGreen}`}>
                {selected.suspiciousPattern ? "Detectado" : "Limpio"}
              </span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estado del análisis</span>
            <span className={`${styles.badge} ${styles.badgeGreen}`}>{selected.status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
