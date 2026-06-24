import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, ChevronRight, Loader2, Gauge, Zap,
  ShieldAlert, History, RefreshCw, ServerCrash,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  listApplications, getApplicationDetail, evaluateScoring,
  runAutomaticApproval, submitManualReview, getAuditTrail,
} from "../../api/scoringApi";
import styles from "../shared.module.css";

const STATUS_CLS = {
  APPROVED: styles.badgeGreen, REJECTED: styles.badgeRed, MANUAL_REVIEW: styles.badgeYellow,
  CREATED: styles.badgeBlue, SCORING: styles.badgeBlue, DISBURSED: styles.badgeGreen,
};

const RISK_COLOR = { LOW: "#16a34a", MEDIUM: "#d97706", HIGH: "#dc2626" };

const EXTERNAL_FIELDS = [
  ["Buró de crédito", "credit_bureau_score", 850],
  ["Servicios públicos", "utility_payment_score", 100],
  ["Billetera digital", "wallet_transaction_score", 100],
  ["E-commerce", "ecommerce_score", 100],
  ["Recargas móviles", "mobile_topup_score", 100],
];

function Spinner({ label }) {
  return (
    <div className={styles.loading}>
      <Loader2 size={16} className={styles.spin} /> {label}
    </div>
  );
}

export default function ReviewPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [auditTrail, setAuditTrail] = useState(null);
  const [showAudit, setShowAudit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  const loadApps = useCallback(() => {
    setListError("");
    return listApplications({ limit: 50 })
      .then(setApps)
      .catch((e) => setListError(e.message));
  }, []);

  useEffect(() => {
    loadApps().finally(() => setLoading(false));
  }, [loadApps]);

  const loadDetail = useCallback(async (applicationId) => {
    setDetailLoading(true);
    setError("");
    try {
      const d = await getApplicationDetail(applicationId);
      setDetail(d);
    } catch (e) {
      setError(e.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function selectApp(app) {
    setSelected(app);
    setDetail(null);
    setAuditTrail(null);
    setShowAudit(false);
    setSuccess("");
    setError("");
    setReason("");
    loadDetail(app.application_id);
  }

  async function refreshSelected() {
    await loadDetail(selected.application_id);
    await loadApps();
  }

  async function handleEvaluate() {
    setEvaluating(true);
    setError("");
    setSuccess("");
    try {
      await evaluateScoring(
        selected.application_id,
        selected.applicant_id,
        Number(detail?.application?.requested_amount)
      );
      setSuccess("Scoring calculado correctamente.");
      await refreshSelected();
    } catch (e) {
      setError(e.message);
    } finally {
      setEvaluating(false);
    }
  }

  async function handleAutomaticApproval() {
    setApproving(true);
    setError("");
    setSuccess("");
    try {
      const result = await runAutomaticApproval(selected.application_id);
      setSuccess(`Decisión automática: ${result.decision} — ${result.reason}`);
      await refreshSelected();
    } catch (e) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  }

  async function handleManualDecision(decision) {
    if (!reason.trim()) { setError("Ingresa una justificación para tu decisión."); return; }
    setSubmitting(true);
    setError("");
    try {
      await submitManualReview(selected.application_id, user?.id, decision, reason.trim());
      setSuccess(`Decisión registrada: ${decision}`);
      setReason("");
      await refreshSelected();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAuditTrail() {
    if (showAudit) { setShowAudit(false); return; }
    setShowAudit(true);
    if (auditTrail) return;
    setAuditLoading(true);
    try {
      const trail = await getAuditTrail(selected.application_id);
      setAuditTrail(trail);
    } catch (e) {
      setError(e.message);
    } finally {
      setAuditLoading(false);
    }
  }

  if (loading) return <Spinner label="Cargando solicitudes..." />;

  const application = detail?.application;
  const scoring = detail?.scoring;
  const decision = detail?.decision;
  const snapshot = detail?.externalDataSnapshot;
  const bureauMeta = snapshot?.raw_data?.bureau;
  const needsManualDecision = application && (application.status === "MANUAL_REVIEW" || decision?.decision === "MANUAL_REVIEW");

  return (
    <div className={styles.page} style={{ maxWidth: 1140 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Revisión Manual</h1>
        <p className={styles.pageSubtitle}>Evaluación de solicitudes escaladas al analista de riesgo — conectado al motor de scoring en tiempo real</p>
      </div>

      {listError && (
        <div className={styles.error}>
          <ServerCrash size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          {listError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem" }}>
        <div className={styles.card} style={{ padding: "1rem", alignSelf: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className={styles.cardTitle}>
            <span>Solicitudes ({apps.length})</span>
            <button
              onClick={loadApps}
              title="Refrescar lista"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          {apps.length === 0 && !listError && (
            <div className={styles.emptyState}>No hay solicitudes registradas todavía.</div>
          )}
          {apps.map((app) => (
            <div
              key={app.application_id}
              onClick={() => selectApp(app)}
              style={{
                padding: "0.75rem", borderRadius: 8, cursor: "pointer",
                background: selected?.application_id === app.application_id ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${selected?.application_id === app.application_id ? "#bfdbfe" : "#e2e8f0"}`,
                marginBottom: "0.5rem", transition: "all 0.12s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>
                  USD {Number(app.requested_amount).toLocaleString()}
                </span>
                <span className={`${styles.badge} ${STATUS_CLS[app.status] || styles.badgeGray}`}>
                  {app.status}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{app.purpose}</span>
                <ChevronRight size={11} />
              </div>
              {app.score != null && (
                <div style={{ marginTop: 6, fontSize: "0.75rem", fontWeight: 700, color: RISK_COLOR[app.risk_level] || "#64748b" }}>
                  Score {app.score} · {app.risk_level}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          {!selected && (
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <Gauge size={28} />
                Selecciona una solicitud para ver el detalle y ejecutar el scoring
              </div>
            </div>
          )}

          {selected && (
            <>
              {detailLoading && <Spinner label="Cargando detalle..." />}

              {!detailLoading && application && (
                <>
                  {success && <div className={styles.success}>{success}</div>}
                  {error && <div className={styles.error}>{error}</div>}

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Solicitud {selected.application_id.slice(0, 8)}…</h3>
                    <div className={styles.grid3}>
                      <div>
                        <div className={styles.infoLabel} style={{ fontSize: "0.7rem", marginBottom: 2 }}>Monto</div>
                        <div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#0f172a" }}>
                          USD {Number(application.requested_amount).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className={styles.infoLabel} style={{ fontSize: "0.7rem", marginBottom: 2 }}>Plazo</div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{application.term_months} meses</div>
                      </div>
                      <div>
                        <div className={styles.infoLabel} style={{ fontSize: "0.7rem", marginBottom: 2 }}>Estado</div>
                        <span className={`${styles.badge} ${STATUS_CLS[application.status] || styles.badgeGray}`}>{application.status}</span>
                      </div>
                    </div>
                    <div className={styles.infoRow} style={{ marginTop: "0.75rem" }}>
                      <span className={styles.infoLabel}>Propósito</span>
                      <span className={styles.infoValue} style={{ maxWidth: "60%", textAlign: "right" }}>{application.purpose}</span>
                    </div>
                    {detail.applicant && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Solicitante</span>
                        <span className={styles.infoValue}>
                          {detail.applicant.document_type} {detail.applicant.document_number}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Score crediticio</h3>
                    {scoring ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "3rem", fontWeight: 800, color: RISK_COLOR[scoring.risk_level] || "#64748b" }}>
                          {scoring.score}
                        </div>
                        <div>
                          <span className={`${styles.badge} ${scoring.risk_level === "LOW" ? styles.badgeGreen : scoring.risk_level === "HIGH" ? styles.badgeRed : styles.badgeYellow}`}>
                            Riesgo {scoring.risk_level}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 6 }}>
                            Modelo: {scoring.model_version} · {(scoring.processing_time_ms / 1000).toFixed(1)}s · recomendación {scoring.recommendation}
                          </div>
                        </div>
                        <button className={styles.btnSecondary} style={{ marginLeft: "auto" }} onClick={handleEvaluate} disabled={evaluating}>
                          {evaluating ? <Loader2 size={14} className={styles.spin} /> : <RefreshCw size={14} />}
                          Reevaluar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Esta solicitud todavía no tiene un score calculado.</span>
                        <button className={styles.btnPrimary} onClick={handleEvaluate} disabled={evaluating}>
                          {evaluating ? <Loader2 size={14} className={styles.spin} /> : <Gauge size={14} />}
                          {evaluating ? "Calculando score..." : "Evaluar ahora"}
                        </button>
                      </div>
                    )}
                  </div>

                  {snapshot && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Fuentes de datos alternativas</h3>
                      <div className={styles.grid2}>
                        {EXTERNAL_FIELDS.map(([label, key, max]) => {
                          const value = snapshot[key];
                          if (value == null) return null;
                          const ratio = value / max;
                          const color = ratio >= 0.75 ? "#16a34a" : ratio >= 0.55 ? "#d97706" : "#dc2626";
                          return (
                            <div key={key}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{label}</span>
                                <span style={{ fontWeight: 700, color }}>{value}</span>
                              </div>
                              <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${Math.min(ratio * 100, 100)}%`, background: color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {bureauMeta && (
                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span className={`${styles.badge} ${styles.badgeBlue}`}>buró: {bureauMeta.source}</span>
                          {bureauMeta.cache_hit && <span className={`${styles.badge} ${styles.badgeYellow}`}>caché inteligente</span>}
                          {bureauMeta.degraded && <span className={`${styles.badge} ${styles.badgeRed}`}>circuito degradado</span>}
                          {bureauMeta.latency_ms != null && (
                            <span className={`${styles.badge} ${styles.badgeGray}`}>{bureauMeta.latency_ms} ms</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Decisión de aprobación</h3>
                    {decision ? (
                      <>
                        <div style={{ display: "flex", gap: "0.625rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
                          <span className={`${styles.badge} ${decision.decision === "APPROVED" ? styles.badgeGreen : decision.decision === "REJECTED" ? styles.badgeRed : styles.badgeYellow}`}>
                            {decision.decision}
                          </span>
                          <span className={`${styles.badge} ${styles.badgeGray}`}>{decision.decision_type}</span>
                        </div>
                        <div style={{ padding: "0.875rem", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9", fontSize: "0.875rem", color: "#374151" }}>
                          {decision.reason}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Sin decisión registrada todavía.</span>
                        <button className={styles.btnPrimary} onClick={handleAutomaticApproval} disabled={approving || !scoring}>
                          {approving ? <Loader2 size={14} className={styles.spin} /> : <Zap size={14} />}
                          {approving ? "Procesando..." : "Ejecutar aprobación automática"}
                        </button>
                      </div>
                    )}
                  </div>

                  {needsManualDecision && (
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>
                        <ShieldAlert size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                        Decisión del analista
                      </h3>
                      <div className={styles.field} style={{ marginBottom: "1rem" }}>
                        <label>Justificación</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="Describe la razón de tu decisión..." rows={3} />
                      </div>
                      <div className={styles.btnRow}>
                        <button className={styles.btnSuccess} onClick={() => handleManualDecision("APPROVED")} disabled={submitting}>
                          {submitting ? <Loader2 size={14} className={styles.spin} /> : <CheckCircle size={14} />} Aprobar
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleManualDecision("REJECTED")} disabled={submitting}>
                          {submitting ? <Loader2 size={14} className={styles.spin} /> : <XCircle size={14} />} Rechazar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 className={styles.cardTitle} style={{ border: "none", margin: 0, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <History size={15} /> Trazabilidad regulatoria
                      </h3>
                      <button className={styles.btnSecondary} onClick={toggleAuditTrail}>
                        {showAudit ? "Ocultar" : "Ver eventos firmados"}
                      </button>
                    </div>
                    {showAudit && (
                      <div style={{ marginTop: "1rem" }}>
                        {auditLoading && <Spinner label="Cargando auditoría..." />}
                        {!auditLoading && auditTrail && (
                          <div className={styles.tableWrap}>
                            <table className={styles.table}>
                              <thead>
                                <tr><th>Evento</th><th>Hash</th><th>Firma</th><th>Fecha</th></tr>
                              </thead>
                              <tbody>
                                {auditTrail.events.map((ev) => (
                                  <tr key={ev.id}>
                                    <td>{ev.event_type}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{ev.hash.slice(0, 12)}…</td>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{ev.digital_signature.slice(0, 12)}…</td>
                                    <td>{new Date(ev.created_at).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {auditTrail.events.length === 0 && (
                              <div className={styles.emptyState}>Sin eventos registrados todavía.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
