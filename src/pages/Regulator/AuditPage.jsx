import { useState, useEffect } from "react";
import { getAuditEvents, getDecisionAudit, getRegulatoryReport } from "../../api/api";
import styles from "../shared.module.css";

export default function AuditPage() {
  const [events, setEvents] = useState([]);
  const [audit, setAudit] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    Promise.all([
      getAuditEvents("app1"),
      getDecisionAudit("app1"),
      getRegulatoryReport(),
    ]).then(([ev, au, rep]) => {
      setEvents(ev);
      setAudit(au);
      setReport(rep);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Cargando auditoría...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1000 }}>
      <h1 className={styles.pageTitle}>Auditoría Regulatoria</h1>
      <p className={styles.pageSubtitle}>Trazabilidad completa, event sourcing y firma digital — cumplimiento regulatorio</p>

      {report && (
        <div className={styles.statGrid}>
          {[
            { label: "Período",          value: report.reportPeriod },
            { label: "Total solicitudes",value: report.totalApplications },
            { label: "Aprobadas",        value: report.approved,     color: "#4ade80" },
            { label: "Rechazadas",       value: report.rejected,     color: "#f87171" },
            { label: "Rev. manual",      value: report.manualReview, color: "#fbbf24" },
            { label: "Score promedio",   value: report.averageScore },
          ].map((s) => (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statValue} style={{ color: s.color || "#38bdf8", fontSize: "1.35rem" }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["events", "decision", "report"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? styles.btnPrimary : styles.btnSecondary}
            style={{ fontSize: "0.85rem", padding: "6px 16px" }}
          >
            {tab === "events" ? "Event Store" : tab === "decision" ? "Auditoría decisión" : "Reporte regulador"}
          </button>
        ))}
      </div>

      {activeTab === "events" && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Event Store — Cadena de bloques de eventos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {events.map((ev, idx) => (
              <div key={ev.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "0.75rem 1rem", position: "relative" }}>
                {idx < events.length - 1 && (
                  <div style={{ position: "absolute", left: 24, bottom: -12, width: 2, height: 12, background: "#334155" }} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className={`${styles.badge} ${styles.badgeBlue}`}>{ev.eventType}</span>
                  <span style={{ fontSize: "0.75rem", color: "#475569" }}>{new Date(ev.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#64748b" }}>
                  <div>Hash: <code style={{ color: "#38bdf8" }}>{ev.hash}</code></div>
                  {ev.previousHash && <div>Prev: <code style={{ color: "#475569" }}>{ev.previousHash}</code></div>}
                </div>
                <pre style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#94a3b8", background: "#1e293b", padding: "0.5rem", borderRadius: 6, overflow: "auto" }}>
                  {JSON.stringify(ev.eventData, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "decision" && audit && (
        <div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Decisión auditada</h3>
            <div className={styles.grid2}>
              <div className={styles.infoRow} style={{ flexDirection: "column" }}>
                <span className={styles.infoLabel}>Score final</span>
                <span style={{ fontSize: "2rem", fontWeight: 700, color: "#4ade80" }}>{audit.finalScore}</span>
              </div>
              <div className={styles.infoRow} style={{ flexDirection: "column" }}>
                <span className={styles.infoLabel}>Decisión</span>
                <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ fontSize: "0.9rem", padding: "6px 16px", marginTop: 4 }}>
                  {audit.finalDecision}
                </span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Razón</span>
              <span className={styles.infoValue} style={{ maxWidth: "60%", textAlign: "right", fontSize: "0.8rem" }}>{audit.decisionReason}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Modelo</span>
              <span className={styles.infoValue}>{audit.modelVersion}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Firmado por</span>
              <span className={styles.infoValue}>{audit.signedBySystem}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Firma digital</span>
              <code style={{ color: "#38bdf8", fontSize: "0.8rem" }}>{audit.digitalSignature}</code>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Variables de entrada</h3>
              {Object.entries(audit.inputVariables).map(([k, v]) => (
                <div className={styles.infoRow} key={k}>
                  <span className={styles.infoLabel}>{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className={styles.infoValue}>{v}</span>
                </div>
              ))}
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Pesos del modelo</h3>
              {Object.entries(audit.modelWeights).map(([k, v]) => (
                <div className={styles.infoRow} key={k}>
                  <span className={styles.infoLabel}>{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className={styles.infoValue}>{(v * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "report" && report && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Reporte regulatorio — {report.reportPeriod}</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Regulador</span>
            <span className={styles.infoValue}>{report.regulatorName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Generado</span>
            <span className={styles.infoValue}>{new Date(report.generatedAt).toLocaleString()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>URL del reporte</span>
            <a href={report.reportUrl} style={{ color: "#38bdf8", fontSize: "0.8rem" }} target="_blank" rel="noreferrer">
              Descargar PDF →
            </a>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tasa de mora</span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>{report.defaultRate}%</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Score promedio de cartera</span>
            <span className={styles.infoValue}>{report.averageScore}</span>
          </div>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
            <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.5rem" }}>CQRS + Event Sourcing activo</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Todos los eventos están inmutablemente registrados con firma digital SHA-256 y encadenamiento de hashes.
              El sistema garantiza no repudio y trazabilidad completa para cumplimiento regulatorio.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
