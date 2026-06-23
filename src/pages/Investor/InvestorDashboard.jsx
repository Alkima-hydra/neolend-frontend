import { useState, useEffect } from "react";
import { getInvestorDashboard, getPortfolioRisk, getCashflow } from "../../api/api";
import styles from "../shared.module.css";

function MiniBar({ value, max, color }) {
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
  );
}

export default function InvestorDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInvestorDashboard(), getPortfolioRisk(), getCashflow()])
      .then(([m, r, c]) => { setMetrics(m); setRisk(r); setCashflow(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Cargando dashboard...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1000 }}>
      <h1 className={styles.pageTitle}>Dashboard Inversionista</h1>
      <p className={styles.pageSubtitle}>Métricas de cartera — Fondo Andino Capital</p>

      <div className={styles.statGrid}>
        {[
          { label: "Total invertido",      value: `USD ${metrics.totalInvested.toLocaleString()}`, color: "#38bdf8" },
          { label: "Créditos activos",     value: metrics.activeLoans,               color: "#4ade80" },
          { label: "Tasa de morosidad",    value: `${metrics.delinquencyRate}%`,      color: metrics.delinquencyRate > 5 ? "#f87171" : "#fbbf24" },
          { label: "TIR proyectada",       value: `${metrics.internalRateReturn}%`,   color: "#4ade80" },
          { label: "Flujo proyectado",     value: `USD ${metrics.projectedCashflow.toLocaleString()}`, color: "#38bdf8" },
          { label: "Exposición al riesgo", value: `${metrics.riskExposure}%`,         color: "#fbbf24" },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ color: s.color, fontSize: "1.5rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Riesgo de cartera</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Exposición</span>
            <span style={{ fontWeight: 700, color: "#fbbf24" }}>{risk.riskExposure}%</span>
          </div>
          <MiniBar value={risk.riskExposure} max={100} color="#fbbf24" />

          <div className={styles.infoRow} style={{ marginTop: "0.75rem" }}>
            <span className={styles.infoLabel}>Morosidad</span>
            <span style={{ fontWeight: 700, color: "#f87171" }}>{risk.delinquencyRate}%</span>
          </div>
          <MiniBar value={risk.delinquencyRate} max={100} color="#f87171" />

          <div className={styles.infoRow} style={{ marginTop: "0.75rem" }}>
            <span className={styles.infoLabel}>Concentración</span>
            <span className={`${styles.badge} ${styles.badgeYellow}`}>{risk.concentrationRisk}</span>
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            <span className={styles.infoLabel}>Principales riesgos</span>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem", color: "#94a3b8", fontSize: "0.8rem" }}>
              {risk.topRisks.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Flujo de caja proyectado</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Proyectado total</span>
            <span className={styles.infoValue}>USD {cashflow.projected.toLocaleString()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cobrado</span>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>USD {cashflow.collected.toLocaleString()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Pendiente</span>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>USD {cashflow.pending.toLocaleString()}</span>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>Proyección mensual (USD)</div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", height: 80 }}>
              {cashflow.months.map((m) => {
                const h = Math.round((m.amount / 55000) * 80);
                return (
                  <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                    <div style={{ width: "100%", height: h, background: "#38bdf8", borderRadius: "4px 4px 0 0", opacity: 0.8 }} />
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
