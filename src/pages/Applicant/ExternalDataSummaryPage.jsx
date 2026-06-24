import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getExternalSummary } from "../../api/api";
import styles from "../shared.module.css";

const SCORE_FIELDS = [
  { key: "credit_bureau_score",      label: "Buró Crediticio",     max: 999  },
  { key: "utility_payment_score",    label: "Servicios Públicos",   max: 1000 },
  { key: "wallet_transaction_score", label: "Billeteras Digitales", max: 1000 },
  { key: "ecommerce_score",          label: "E-commerce",           max: 1000 },
  { key: "mobile_topup_score",       label: "Recargas Móviles",     max: 1000 },
];

function scoreColor(pct) {
  return pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
}

function ScoreBar({ label, value, max }) {
  if (value == null) {
    return (
      <div style={{ marginBottom: "0.875rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{label}</span>
          <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontStyle: "italic" }}>Pendiente...</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: "0%" }} />
        </div>
      </div>
    );
  }
  const pct   = Math.min((value / max) * 100, 100);
  const color = scoreColor(pct);
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>{label}</span>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color }}>{value.toLocaleString()}</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CompositeEstimate({ score }) {
  if (score == null) return null;
  let label, cls;
  if (score >= 700)      { label = "Probable aprobación automática"; cls = styles.badgeGreen; }
  else if (score >= 600) { label = "Probable revisión manual";       cls = styles.badgeYellow; }
  else                   { label = "Probable rechazo";               cls = styles.badgeRed; }
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

export default function ExternalDataSummaryPage() {
  const [searchParams] = useSearchParams();
  const id             = searchParams.get("id");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError]     = useState("");
  const intervalRef    = useRef(null);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    async function fetchSummary() {
      try {
        const result = await getExternalSummary(id);
        setData(result);
        setLoading(false);
        if (result.all_sources_ready) stopPolling();
      } catch (err) {
        setError(err.message);
        setLoading(false);
        stopPolling();
      }
    }

    fetchSummary();
    intervalRef.current = setInterval(fetchSummary, 5000);
    return () => stopPolling();
  }, [id]);

  if (!id) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Resumen de Datos Externos</h1>
        </div>
        <div className={styles.card} style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
          No se especificó una solicitud.{" "}
          <Link to="/applicant/apply" style={{ color: "#1d4ed8" }}>Crear solicitud</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className={styles.loading}>Consultando fuentes externas...</div>;
  if (error)   return <div className={styles.error}>{error}</div>;
  if (!data)   return null;

  const composite     = data.composite_score;
  const compositePct  = composite != null ? Math.min((composite / 1000) * 100, 100) : 0;
  const compositeColor = composite != null ? scoreColor(compositePct) : "#94a3b8";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className={styles.pageTitle}>Resumen de Datos Externos</h1>
            <p className={styles.pageSubtitle}>Fuentes de datos alternativos consultadas durante tu evaluación crediticia</p>
          </div>
          <Link to={`/applicant/application-status?id=${id}`}>
            <button className={styles.btnSecondary}><ArrowLeft size={13} /> Volver</button>
          </Link>
        </div>
      </div>

      {!data.all_sources_ready && (
        <div className={styles.infoBox} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <RefreshCw size={13} /> Consultando fuentes... actualizando cada 5 segundos.
        </div>
      )}

      {/* Score compuesto */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Score Compuesto</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "2.25rem", fontWeight: 700, color: compositeColor, lineHeight: 1 }}>
            {composite != null ? composite.toLocaleString() : "—"}
          </span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 4 }}>de 1,000 puntos</div>
            <CompositeEstimate score={composite} />
          </div>
        </div>
        <div className={styles.progressBar} style={{ height: 10 }}>
          <div className={styles.progressFill} style={{ width: `${compositePct}%`, background: compositeColor }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.375rem" }}>
          <span>0</span>
          <span>600 (mínimo)</span>
          <span>700 (aprobado)</span>
          <span>1,000</span>
        </div>
      </div>

      {/* Scores por fuente */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Puntajes por fuente</h3>
        {SCORE_FIELDS.map(({ key, label, max }) => (
          <ScoreBar key={key} label={label} value={data[key]} max={max} />
        ))}
      </div>

      <div style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", marginTop: "0.25rem" }}>
        Solicitud {data.application_id}
        {data.all_sources_ready ? " · Todas las fuentes consultadas" : " · Algunas fuentes aún están siendo consultadas"}
      </div>
    </div>
  );
}
