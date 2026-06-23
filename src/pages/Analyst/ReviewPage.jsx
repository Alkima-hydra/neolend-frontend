import { useState, useEffect } from "react";
import { getAllApplications, getScoringResult, getDecision, submitAnalystDecision, getExternalDataSummary } from "../../api/api";
import styles from "../shared.module.css";

const STATUS_COLORS = {
  APPROVED: styles.badgeGreen, REJECTED: styles.badgeRed, MANUAL_REVIEW: styles.badgeYellow,
  CREATED: styles.badgeBlue, SCORING: styles.badgeBlue,
};

export default function ReviewPage() {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [decision, setDecision] = useState(null);
  const [externalData, setExternalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getAllApplications().then(setApps).finally(() => setLoading(false));
  }, []);

  async function selectApp(app) {
    setSelected(app);
    setScoring(null);
    setDecision(null);
    setExternalData(null);
    setSuccess("");
    setDetailLoading(true);
    const [sc, dec, ext] = await Promise.all([
      getScoringResult(app.id).catch(() => null),
      getDecision(app.id).catch(() => null),
      getExternalDataSummary(app.id).catch(() => null),
    ]);
    setScoring(sc);
    setDecision(dec);
    setExternalData(ext);
    setDetailLoading(false);
  }

  async function handleDecision(decisionValue) {
    if (!reason.trim()) { alert("Ingresa una razón para la decisión"); return; }
    setSubmitting(true);
    try {
      await submitAnalystDecision(selected.id, decisionValue, reason);
      setApps((prev) => prev.map((a) => a.id === selected.id ? { ...a, status: decisionValue } : a));
      setSelected((prev) => ({ ...prev, status: decisionValue }));
      setSuccess(`Decisión "${decisionValue}" registrada correctamente.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className={styles.loading}>Cargando solicitudes...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1100 }}>
      <h1 className={styles.pageTitle}>Revisión Manual del Analista</h1>
      <p className={styles.pageSubtitle}>Evalúa solicitudes escaladas a revisión manual</p>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.25rem" }}>
        <div>
          <div className={styles.card} style={{ padding: "1rem" }}>
            <div className={styles.cardTitle} style={{ marginBottom: "0.75rem" }}>Solicitudes ({apps.length})</div>
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => selectApp(app)}
                style={{
                  padding: "0.75rem",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: selected?.id === app.id ? "#0f2744" : "transparent",
                  border: `1px solid ${selected?.id === app.id ? "#38bdf8" : "#334155"}`,
                  marginBottom: "0.5rem",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>
                    USD {app.requestedAmount}
                  </span>
                  <span className={`${styles.badge} ${STATUS_COLORS[app.status] || styles.badgeGray}`}>
                    {app.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{app.purpose}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selected && (
            <div className={styles.card} style={{ textAlign: "center", color: "#475569", padding: "3rem" }}>
              Selecciona una solicitud de la lista para ver detalles
            </div>
          )}
          {selected && (
            <>
              {detailLoading && <div className={styles.loading}>Cargando detalles...</div>}
              {!detailLoading && (
                <>
                  {success && <div className={styles.success}>{success}</div>}

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Solicitud #{selected.id}</h3>
                    <div className={styles.grid2}>
                      <div className={styles.infoRow} style={{ flexDirection: "column" }}>
                        <span className={styles.infoLabel}>Monto</span>
                        <span className={styles.infoValue}>USD {selected.requestedAmount}</span>
                      </div>
                      <div className={styles.infoRow} style={{ flexDirection: "column" }}>
                        <span className={styles.infoLabel}>Plazo</span>
                        <span className={styles.infoValue}>{selected.termMonths} meses</span>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Propósito</span>
                      <span className={styles.infoValue}>{selected.purpose}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Estado</span>
                      <span className={`${styles.badge} ${STATUS_COLORS[selected.status] || styles.badgeGray}`}>
                        {selected.status}
                      </span>
                    </div>
                  </div>

                  {scoring && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Resultado de Scoring</h3>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: scoring.riskLevel === "LOW" ? "#4ade80" : scoring.riskLevel === "HIGH" ? "#f87171" : "#fbbf24" }}>
                          {scoring.score}
                        </div>
                        <div>
                          <div className={`${styles.badge} ${scoring.riskLevel === "LOW" ? styles.badgeGreen : scoring.riskLevel === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
                            {scoring.riskLevel} RISK
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>{scoring.modelVersion}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        Procesado en {(scoring.processingTimeMs / 1000).toFixed(1)}s
                      </div>
                    </div>
                  )}

                  {externalData && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Datos externos clave</h3>
                      <div className={styles.grid2}>
                        {[
                          ["Buró", externalData.creditBureauScore],
                          ["Servicios", externalData.utilityPaymentScore],
                          ["Billetera", externalData.walletTransactionScore],
                          ["E-commerce", externalData.ecommerceScore],
                        ].map(([k, v]) => (
                          <div key={k} className={styles.infoRow} style={{ flexDirection: "column", gap: 2 }}>
                            <span className={styles.infoLabel}>{k}</span>
                            <span style={{ fontWeight: 700, color: v >= 75 ? "#4ade80" : v >= 55 ? "#fbbf24" : "#f87171" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.status === "MANUAL_REVIEW" && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Decisión del analista</h3>
                      <div className={styles.field} style={{ marginBottom: "1rem" }}>
                        <label>Razón / justificación</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Describe la razón de tu decisión..."
                          rows={3}
                        />
                      </div>
                      <div className={styles.btnRow}>
                        <button className={styles.btnSuccess} onClick={() => handleDecision("APPROVED")} disabled={submitting}>
                          ✅ Aprobar
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleDecision("REJECTED")} disabled={submitting}>
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
