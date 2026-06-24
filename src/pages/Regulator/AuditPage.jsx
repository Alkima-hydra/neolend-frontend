import { useState, useEffect } from "react";
import { Link2, FileText, ClipboardList } from "lucide-react";
import { getAuditEvents, getDecisionAudit, getRegulatoryReport } from "../../api/AuditApi";
import styles from "../shared.module.css";

const TABS = [
  { key: "events",   label: "Event Store",        Icon: Link2 },
  { key: "decision", label: "Auditoría decisión", Icon: FileText },
  { key: "report",   label: "Reporte regulador",  Icon: ClipboardList },
];

export default function AuditPage() {
  const [events, setEvents]     = useState([]);
  const [audit, setAudit]       = useState(null);
  const [report, setReport]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    Promise.all([getAuditEvents(), getDecisionAudit(), getRegulatoryReport()])
      .then(([ev, au, rep]) => { setEvents(ev); setAudit(au); setReport(rep); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Cargando datos de auditoría...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1000 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Auditoría Regulatoria</h1>
        <p className={styles.pageSubtitle}>Trazabilidad completa con Event Sourcing, firma digital SHA-256 y CQRS</p>
      </div>

      {report && (
        <div className={styles.statGrid}>
          {[
            { label: "Período",            value: report.reportPeriod },
            { label: "Solicitudes totales",value: report.totalApplications },
            { label: "Aprobadas",          value: report.approved,      color: "#16a34a" },
            { label: "Rechazadas",         value: report.rejected,      color: "#dc2626" },
            { label: "Rev. manual",        value: report.manualReview,  color: "#d97706" },
            { label: "Score promedio",     value: report.averageScore,  color: "#1d4ed8" },
          ].map((s) => (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statValue} style={{ color: s.color || "#1d4ed8", fontSize: "1.375rem" }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.5rem 1rem", borderRadius: 7, border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500,
              background: activeTab === key ? "#eff6ff" : "transparent",
              color: activeTab === key ? "#1d4ed8" : "#64748b",
              transition: "all 0.12s",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "events" && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Event Store — Cadena inmutable de eventos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {events.map((ev, idx) => (
              <div key={ev.id} style={{ position: "relative" }}>
                {idx < events.length - 1 && (
                  <div style={{ position: "absolute", left: 20, bottom: -14, width: 1, height: 14, background: "#e2e8f0" }} />
                )}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.875rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className={`${styles.badge} ${styles.badgeBlue}`}>{ev.eventType}</span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{new Date(ev.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.75rem", color: "#64748b", marginBottom: 6, flexWrap: "wrap" }}>
                    <span>Hash: <code style={{ color: "#1d4ed8", background: "#eff6ff", padding: "1px 5px", borderRadius: 4 }}>{ev.hash}</code></span>
                    {ev.previousHash && <span>Anterior: <code style={{ color: "#94a3b8", background: "#f8fafc", padding: "1px 5px", borderRadius: 4 }}>{ev.previousHash}</code></span>}
                  </div>
                  <pre style={{ fontSize: "0.75rem", color: "#374151", background: "#fff", border: "1px solid #e2e8f0", padding: "0.625rem", borderRadius: 6, overflow: "auto", margin: 0 }}>
                    {JSON.stringify(ev.eventData, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "decision" && audit && (
        <>
          <div className={styles.card} style={{ textAlign: "center", paddingBlock: "1.75rem" }}>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Score auditado</div>
            <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>{audit.finalScore}</div>
            <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginTop: "0.75rem", display: "inline-block" }}>{audit.finalDecision}</span>
          </div>

          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Metadatos de la decisión</h3>
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
                <code style={{ fontSize: "0.75rem", color: "#1d4ed8" }}>{audit.digitalSignature}</code>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Fecha</span>
                <span className={styles.infoValue}>{new Date(audit.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: "0.875rem", padding: "0.75rem", background: "#f8fafc", borderRadius: 7, border: "1px solid #f1f5f9", fontSize: "0.8125rem", color: "#475569" }}>
                {audit.decisionReason}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Variables de entrada</h3>
              {Object.entries(audit.inputVariables).map(([k, v]) => (
                <div className={styles.infoRow} key={k}>
                  <span className={styles.infoLabel} style={{ textTransform: "none", fontSize: "0.8125rem" }}>
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className={styles.infoValue}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Pesos del modelo</h3>
            {Object.entries(audit.modelWeights).map(([k, v]) => (
              <div key={k} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "0.8125rem" }}>{(v * 100).toFixed(0)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${v * 100}%`, background: "#3b82f6" }} />
                </div>
              </div>
            ))}
          </div>
        </>
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
            <span className={styles.infoLabel}>Tasa de mora</span>
            <span style={{ fontWeight: 700, color: "#16a34a" }}>{report.defaultRate}%</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Score promedio</span>
            <span className={styles.infoValue}>{report.averageScore}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>URL del reporte</span>
            <a href={report.reportUrl} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontSize: "0.875rem" }}>
              Descargar PDF
            </a>
          </div>

          <div style={{ marginTop: "1.25rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "1rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, marginBottom: "0.5rem" }}>CQRS + EVENT SOURCING ACTIVO</div>
            <div style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.6 }}>
              Todos los eventos están inmutablemente registrados con firma digital SHA-256 y encadenamiento de hashes.
              El sistema garantiza no repudio y trazabilidad completa para cumplimiento regulatorio.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
