import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { getInvestorDashboard, getPortfolioRisk, getCashflow } from "../../api/AuditApi";
import styles from "../shared.module.css";

export default function InvestorDashboard() {
  const [metrics, setMetrics]   = useState(null);
  const [risk, setRisk]         = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    Promise.all([getInvestorDashboard(), getPortfolioRisk(), getCashflow()])
      .then(([m, r, c]) => { setMetrics(m); setRisk(r); setCashflow(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Cargando dashboard...</div>;
  if (error)   return <div className={styles.error}>Error al cargar el dashboard: {error}</div>;
  if (!metrics || !cashflow || !risk) return <div className={styles.loading}>Sin datos disponibles.</div>;

  const months = cashflow.months || [];
  const maxCashflow = months.length ? Math.max(...months.map((m) => m.amount)) : 1;

  return (
    <div className={styles.page} style={{ maxWidth: 1000 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard de Inversión</h1>
        <p className={styles.pageSubtitle}>Métricas de cartera — Fondo Andino Capital</p>
      </div>

      <div className={styles.statGrid}>
        {[
          { label: "Total invertido",      value: `USD ${(metrics.totalInvested || 0).toLocaleString()}`,    color: "#1d4ed8" },
          { label: "Créditos activos",     value: metrics.activeLoans || 0,                                   color: "#16a34a" },
          { label: "Tasa de morosidad",    value: `${metrics.delinquencyRate || 0}%`,                         color: (metrics.delinquencyRate || 0) > 5 ? "#dc2626" : "#d97706" },
          { label: "TIR proyectada",       value: `${metrics.internalRateReturn || 0}%`,                      color: "#16a34a" },
          { label: "Flujo proyectado",     value: `USD ${(metrics.projectedCashflow || 0).toLocaleString()}`, color: "#1d4ed8" },
          { label: "Exposición al riesgo", value: `${metrics.riskExposure || 0}%`,                            color: "#d97706" },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ color: s.color, fontSize: "1.375rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={15} color="#d97706" /> Riesgo de cartera
          </h3>
          {[
            { label: "Exposición al riesgo", value: risk.riskExposure || 0, max: 100 },
            { label: "Tasa de morosidad",    value: risk.delinquencyRate || 0, max: 100 },
          ].map((r) => (
            <div key={r.label} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.value > 10 ? "#dc2626" : "#d97706" }}>{r.value}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(r.value / r.max) * 100}%`, background: r.value > 10 ? "#dc2626" : "#d97706" }} />
              </div>
            </div>
          ))}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Concentración</span>
            <span className={`${styles.badge} ${styles.badgeYellow}`}>{risk.concentrationRisk || "MEDIUM"}</span>
          </div>
          {(risk.topRisks || []).length > 0 && (
            <div style={{ marginTop: "0.875rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, marginBottom: "0.5rem" }}>PRINCIPALES RIESGOS</div>
              <ul style={{ paddingLeft: "1.125rem", color: "#64748b", fontSize: "0.8125rem" }}>
                {risk.topRisks.map((r) => <li key={r} style={{ marginBottom: 3 }}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={15} color="#1d4ed8" /> Flujo de caja
          </h3>
          {[
            ["Proyectado", cashflow.projected  || 0, "#1d4ed8"],
            ["Cobrado",    cashflow.collected  || 0, "#16a34a"],
            ["Pendiente",  cashflow.pending    || 0, "#d97706"],
          ].map(([k, v, c]) => (
            <div className={styles.infoRow} key={k}>
              <span className={styles.infoLabel}>{k}</span>
              <span style={{ fontWeight: 700, color: c }}>USD {v.toLocaleString()}</span>
            </div>
          ))}

          {months.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, marginBottom: "0.75rem" }}>PROYECCIÓN MENSUAL (USD)</div>
              <div style={{ display: "flex", gap: "0.375rem", alignItems: "flex-end", height: 80 }}>
                {months.map((m) => {
                  const h = Math.round((m.amount / maxCashflow) * 80);
                  return (
                    <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
                      <div title={`USD ${m.amount.toLocaleString()}`}
                        style={{ width: "100%", height: h, background: "#bfdbfe", borderRadius: "3px 3px 0 0", transition: "height 0.3s" }} />
                      <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
