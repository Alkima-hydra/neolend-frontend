import { useState, useEffect } from "react";
import { Shield, ShieldAlert, X } from "lucide-react";
import { getAllFraudChecks } from "../../api/AuditApi";
import styles from "../shared.module.css";

const RISK_CLS = { LOW: styles.badgeGreen, MEDIUM: styles.badgeYellow, HIGH: styles.badgeRed };

function ScoreGauge({ value, label }) {
  const color = value >= 90 ? "#16a34a" : value >= 75 ? "#d97706" : "#dc2626";
  return (
    <div style={{ textAlign: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color, lineHeight: 1 }}>{value.toFixed(1)}%</div>
      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function FraudPage() {
  const [checks, setChecks]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllFraudChecks().then(setChecks).finally(() => setLoading(false));
  }, []);

  const high   = checks.filter((c) => c.fraudRiskLevel === "HIGH").length;
  const medium = checks.filter((c) => c.fraudRiskLevel === "MEDIUM").length;
  const suspicious = checks.filter((c) => c.suspiciousPattern).length;

  if (loading) return <div className={styles.loading}>Cargando análisis de fraude...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1000 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Detección de Fraude</h1>
        <p className={styles.pageSubtitle}>Resultados de validación biométrica y documental por solicitud</p>
      </div>

      <div className={styles.infoBox} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <Shield size={15} />
        Los datos biométricos se procesan localmente y no salen del país. Cumplimiento Ley 1582 / GDPR.
      </div>

      <div className={styles.statGrid}>
        {[
          { label: "Solicitudes analizadas", value: checks.length },
          { label: "Riesgo alto",            value: high,      color: high > 0 ? "#dc2626" : "#16a34a" },
          { label: "Riesgo medio",           value: medium,    color: medium > 0 ? "#d97706" : "#16a34a" },
          { label: "Patrones sospechosos",   value: suspicious, color: suspicious > 0 ? "#dc2626" : "#16a34a" },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ color: s.color || "#1d4ed8", fontSize: "1.5rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Análisis por solicitud</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Solicitud</th><th>Propósito</th><th>Doc. Match</th><th>Biometría</th>
                <th>Id. Robada</th><th>Patrón sospechoso</th><th>Nivel riesgo</th><th></th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{c.applicationId}</td>
                  <td style={{ fontSize: "0.8125rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.purpose}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: c.documentMatchScore >= 90 ? "#16a34a" : "#dc2626" }}>
                      {c.documentMatchScore}%
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: c.biometricMatchScore >= 90 ? "#16a34a" : "#dc2626" }}>
                      {c.biometricMatchScore}%
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${c.stolenIdentityMatch ? styles.badgeRed : styles.badgeGreen}`}>
                      {c.stolenIdentityMatch ? "Detectada" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${c.suspiciousPattern ? styles.badgeYellow : styles.badgeGreen}`}>
                      {c.suspiciousPattern ? "Sí" : "No"}
                    </span>
                  </td>
                  <td><span className={`${styles.badge} ${RISK_CLS[c.fraudRiskLevel]}`}>{c.fraudRiskLevel}</span></td>
                  <td>
                    <button className={styles.btnSecondary} style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => setSelected(c)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>
              <ShieldAlert size={16} style={{ display: "inline", marginRight: 6 }} />
              Detalle — {selected.applicationId}
            </h3>
            <button className={styles.btnSecondary} style={{ padding: "4px 10px" }} onClick={() => setSelected(null)}>
              <X size={13} />
            </button>
          </div>

          <div className={styles.grid3} style={{ marginBottom: "1.25rem" }}>
            <ScoreGauge value={selected.documentMatchScore}  label="Coincidencia documental" />
            <ScoreGauge value={selected.biometricMatchScore} label="Coincidencia biométrica" />
            <div style={{ textAlign: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span className={`${styles.badge} ${RISK_CLS[selected.fraudRiskLevel]}`} style={{ fontSize: "0.875rem", padding: "5px 14px" }}>
                {selected.fraudRiskLevel}
              </span>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 6 }}>Nivel de riesgo</div>
            </div>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Identidad robada detectada</span>
            <span className={`${styles.badge} ${selected.stolenIdentityMatch ? styles.badgeRed : styles.badgeGreen}`}>
              {selected.stolenIdentityMatch ? "ALERTA — Detectada" : "No detectada"}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Patrón sospechoso</span>
            <span className={`${styles.badge} ${selected.suspiciousPattern ? styles.badgeYellow : styles.badgeGreen}`}>
              {selected.suspiciousPattern ? "Detectado" : "Sin anomalías"}
            </span>
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
