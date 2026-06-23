import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { getAllApplications, getScoringResult, getDecision, submitAnalystDecision, getExternalDataSummary } from "../../api/api";
import styles from "../shared.module.css";

const STATUS_CLS = {
  APPROVED: styles.badgeGreen, REJECTED: styles.badgeRed, MANUAL_REVIEW: styles.badgeYellow,
  CREATED: styles.badgeBlue, SCORING: styles.badgeBlue,
};

export default function ReviewPage() {
  const [apps, setApps]                 = useState([]);
  const [selected, setSelected]         = useState(null);
  const [scoring, setScoring]           = useState(null);
  const [decision, setDecision]         = useState(null);
  const [extData, setExtData]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason]             = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [success, setSuccess]           = useState("");

  useEffect(() => {
    getAllApplications().then(setApps).finally(() => setLoading(false));
  }, []);

  async function selectApp(app) {
    setSelected(app); setScoring(null); setDecision(null); setExtData(null); setSuccess(""); setReason("");
    setDetailLoading(true);
    const [sc, dec, ext] = await Promise.all([
      getScoringResult(app.id).catch(() => null),
      getDecision(app.id).catch(() => null),
      getExternalDataSummary(app.id).catch(() => null),
    ]);
    setScoring(sc); setDecision(dec); setExtData(ext);
    setDetailLoading(false);
  }

  async function handleDecision(val) {
    if (!reason.trim()) { alert("Ingresa una razón para tu decisión."); return; }
    setSubmitting(true);
    await submitAnalystDecision(selected.id, val, reason);
    setApps((prev) => prev.map((a) => a.id === selected.id ? { ...a, status: val } : a));
    setSelected((prev) => ({ ...prev, status: val }));
    setSuccess(`Decisión registrada: ${val}`);
    setSubmitting(false);
  }

  if (loading) return <div className={styles.loading}>Cargando solicitudes...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1100 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Revisión Manual</h1>
        <p className={styles.pageSubtitle}>Evaluación de solicitudes escaladas al analista de riesgo</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem" }}>
        <div className={styles.card} style={{ padding: "1rem", alignSelf: "start" }}>
          <div className={styles.cardTitle}>Solicitudes ({apps.length})</div>
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => selectApp(app)}
              style={{
                padding: "0.75rem", borderRadius: 8, cursor: "pointer",
                background: selected?.id === app.id ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${selected?.id === app.id ? "#bfdbfe" : "#e2e8f0"}`,
                marginBottom: "0.5rem", transition: "all 0.12s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>
                  USD {app.requestedAmount}
                </span>
                <span className={`${styles.badge} ${STATUS_CLS[app.status] || styles.badgeGray}`}>
                  {app.status}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                {app.purpose} <ChevronRight size={11} />
              </div>
            </div>
          ))}
        </div>

        <div>
          {!selected && (
            <div className={styles.card} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              Selecciona una solicitud para ver el detalle
            </div>
          )}
          {selected && (
            <>
              {detailLoading && <div className={styles.loading}>Cargando detalles...</div>}
              {!detailLoading && (
                <>
                  {success && <div className={styles.success}>{success}</div>}

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Solicitud {selected.id}</h3>
                    <div className={styles.grid2}>
                      <div><div className={styles.infoLabel} style={{ fontSize: "0.7rem", marginBottom: 2 }}>Monto</div>
                        <div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#0f172a" }}>USD {selected.requestedAmount}</div></div>
                      <div><div className={styles.infoLabel} style={{ fontSize: "0.7rem", marginBottom: 2 }}>Plazo</div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{selected.termMonths} meses</div></div>
                    </div>
                    <div className={styles.infoRow} style={{ marginTop: "0.75rem" }}>
                      <span className={styles.infoLabel}>Propósito</span>
                      <span className={styles.infoValue} style={{ maxWidth: "60%", textAlign: "right" }}>{selected.purpose}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Estado actual</span>
                      <span className={`${styles.badge} ${STATUS_CLS[selected.status] || styles.badgeGray}`}>{selected.status}</span>
                    </div>
                  </div>

                  {scoring && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Score crediticio</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <div style={{
                          fontSize: "3rem", fontWeight: 800,
                          color: scoring.riskLevel === "LOW" ? "#16a34a" : scoring.riskLevel === "HIGH" ? "#dc2626" : "#d97706",
                        }}>{scoring.score}</div>
                        <div>
                          <span className={`${styles.badge} ${scoring.riskLevel === "LOW" ? styles.badgeGreen : scoring.riskLevel === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
                            Riesgo {scoring.riskLevel}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 6 }}>
                            Modelo: {scoring.modelVersion} · {(scoring.processingTimeMs/1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {extData && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Datos externos clave</h3>
                      <div className={styles.grid2}>
                        {[
                          ["Buró", extData.creditBureauScore, 850],
                          ["Servicios", extData.utilityPaymentScore, 100],
                          ["Billetera", extData.walletTransactionScore, 100],
                          ["E-commerce", extData.ecommerceScore, 100],
                        ].map(([k, v, mx]) => (
                          <div key={k}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{k}</span>
                              <span style={{ fontWeight: 700, color: v / mx >= 0.75 ? "#16a34a" : v / mx >= 0.55 ? "#d97706" : "#dc2626" }}>{v}</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div className={styles.progressFill} style={{ width: `${(v/mx)*100}%`, background: v/mx >= 0.75 ? "#16a34a" : v/mx >= 0.55 ? "#d97706" : "#dc2626" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.status === "MANUAL_REVIEW" && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Decisión del analista</h3>
                      <div className={styles.field} style={{ marginBottom: "1rem" }}>
                        <label>Justificación</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="Describe la razón de tu decisión..." rows={3} />
                      </div>
                      <div className={styles.btnRow}>
                        <button className={styles.btnSuccess} onClick={() => handleDecision("APPROVED")} disabled={submitting}>
                          <CheckCircle size={14} /> Aprobar
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleDecision("REJECTED")} disabled={submitting}>
                          <XCircle size={14} /> Rechazar
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
