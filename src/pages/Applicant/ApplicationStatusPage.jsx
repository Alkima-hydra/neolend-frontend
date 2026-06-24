import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getCreditApplicationById,
  getApplicantByUserId,
  getApplicationsByApplicant,
} from "../../api/api";
import styles from "../shared.module.css";

const TERMINAL = new Set(["APPROVED", "REJECTED", "DISBURSED"]);
const POLLING  = new Set(["CREATED", "DATA_COLLECTING", "SCORING"]);

const STATUS_CONFIG = {
  CREATED: {
    label: "Solicitud recibida",
    message: "Tu solicitud fue recibida y está siendo procesada.",
    badgeClass: styles.badgeBlue,
    ui: "spinner",
  },
  DATA_COLLECTING: {
    label: "Verificando historial",
    message: "Verificando tu historial financiero... puede tardar ~30 segundos.",
    badgeClass: styles.badgeBlue,
    ui: "progress",
  },
  SCORING: {
    label: "Calculando puntaje",
    message: "Calculando tu puntaje crediticio...",
    badgeClass: styles.badgeYellow,
    ui: "spinner",
  },
  APPROVED: {
    label: "¡Crédito aprobado!",
    message: "¡Felicitaciones! Tu crédito fue aprobado.",
    badgeClass: styles.badgeGreen,
    ui: "approved",
  },
  MANUAL_REVIEW: {
    label: "En revisión manual",
    message: "Tu solicitud está siendo revisada por un analista crediticio.",
    badgeClass: styles.badgeYellow,
    ui: "manual",
  },
  REJECTED: {
    label: "Solicitud no aprobada",
    message: "Tu solicitud no fue aprobada en esta ocasión. Puedes mejorar tu historial e intentarlo de nuevo en 30 días.",
    badgeClass: styles.badgeRed,
    ui: "rejected",
  },
  DISBURSED: {
    label: "Crédito desembolsado",
    message: "Tu crédito ha sido desembolsado exitosamente.",
    badgeClass: styles.badgePurple,
    ui: "disbursed",
  },
};

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid #e2e8f0", borderTopColor: "#1d4ed8",
        animation: "nlSpin 0.8s linear infinite",
      }} />
    </div>
  );
}

// ─── List view (no id param) ──────────────────────────────────────────────────

function ApplicationList() {
  const { user } = useAuth();
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    async function load() {
      try {
        const applicant = await getApplicantByUserId(user.id);
        const list      = await getApplicationsByApplicant(applicant.id);
        // newest first
        setApps([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  if (loading) return <div className={styles.loading}>Cargando solicitudes...</div>;
  if (error)   return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className={styles.pageTitle}>Mis Solicitudes</h1>
            <p className={styles.pageSubtitle}>Historial de tus solicitudes de crédito</p>
          </div>
          <Link to="/applicant/apply">
            <button className={styles.btnPrimary}><Plus size={14} /> Nueva solicitud</button>
          </Link>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className={styles.card} style={{ textAlign: "center", padding: "2.5rem" }}>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>Todavía no tienes solicitudes.</p>
          <Link to="/applicant/apply">
            <button className={styles.btnPrimary}><Plus size={14} /> Crear solicitud</button>
          </Link>
        </div>
      ) : (
        apps.map((app) => {
          const cfg = STATUS_CONFIG[app.status] || { label: app.status, badgeClass: styles.badgeGray };
          const amount = parseFloat(app.requestedAmount ?? app.requested_amount);
          const months = app.termMonths ?? app.term_months;
          const created = app.createdAt ?? app.created_at;
          return (
            <div key={app.id} className={styles.card} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>
                    {app.purpose || "Solicitud de crédito"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {new Date(created).toLocaleString()}
                  </div>
                </div>
                <span className={`${styles.badge} ${cfg.badgeClass}`}>{cfg.label}</span>
              </div>

              <div className={styles.grid3} style={{ marginBottom: "0.875rem" }}>
                {[
                  ["Monto", `${app.currency || "USD"} ${amount.toLocaleString()}`],
                  ["Plazo", `${months} meses`],
                  ["ID", app.id],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{v}</div>
                  </div>
                ))}
              </div>

              <Link to={`/applicant/application-status?id=${app.id}`}>
                <button className={styles.btnSecondary} style={{ width: "100%" }}>
                  Ver estado <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Single-app polling view ──────────────────────────────────────────────────

export default function ApplicationStatusPage() {
  const [searchParams] = useSearchParams();
  const id             = searchParams.get("id");

  if (!id) return <ApplicationList />;

  return <SingleAppView id={id} />;
}

function SingleAppView({ id }) {
  const [app, setApp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const intervalRef           = useRef(null);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    async function fetchApp() {
      try {
        const data = await getCreditApplicationById(id);
        setApp(data);
        setLoading(false);
        if (TERMINAL.has(data.status)) stopPolling();
      } catch (err) {
        setError(err.message);
        setLoading(false);
        stopPolling();
      }
    }

    fetchApp();
    intervalRef.current = setInterval(fetchApp, 3000);
    return () => stopPolling();
  }, [id]);

  if (loading) return <div className={styles.loading}>Consultando estado de tu solicitud...</div>;
  if (error)   return <div className={styles.error}>{error}</div>;
  if (!app)    return null;

  const config = STATUS_CONFIG[app.status] || {
    label: app.status, message: "", badgeClass: styles.badgeGray, ui: "spinner",
  };

  const amount  = parseFloat(app.requested_amount ?? app.requestedAmount);
  const months  = app.term_months ?? app.termMonths;
  const created = app.created_at ?? app.createdAt;

  return (
    <div className={styles.page}>
      <style>{`@keyframes nlSpin { to { transform: rotate(360deg); } }`}</style>

      <div className={styles.pageHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className={styles.pageTitle}>Estado de Solicitud</h1>
            <p className={styles.pageSubtitle}>Seguimiento en tiempo real de tu evaluación crediticia</p>
          </div>
          <Link to="/applicant/application-status">
            <button className={styles.btnSecondary}>← Mis solicitudes</button>
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>
              {app.purpose || "Solicitud de crédito"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              ID: {app.id} · Creada: {new Date(created).toLocaleString()}
            </div>
          </div>
          <span className={`${styles.badge} ${config.badgeClass}`}>{config.label}</span>
        </div>

        <div className={styles.grid3} style={{ marginBottom: "1.25rem" }}>
          {[
            ["Monto", `${app.currency || "USD"} ${amount.toLocaleString()}`],
            ["Plazo", `${months} meses`],
            ["Moneda", app.currency],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
          <p style={{ color: "#475569", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{config.message}</p>

          {config.ui === "spinner" && <Spinner />}

          {config.ui === "progress" && (
            <>
              <div className={styles.progressBar} style={{ height: 8, marginBottom: "0.75rem" }}>
                <div className={styles.progressFill} style={{ width: "55%", background: "#1d4ed8" }} />
              </div>
              <div className={styles.infoBox}>
                Estamos consultando múltiples fuentes de datos alternativos. Este proceso puede tardar ~30 segundos.
              </div>
            </>
          )}

          {config.ui === "approved" && (
            <div className={styles.btnRow}>
              <Link to={`/applicant/external-data-summary?id=${id}`}>
                <button className={styles.btnSuccess}>Ver detalle de evaluación <ArrowRight size={13} /></button>
              </Link>
            </div>
          )}

          {config.ui === "manual" && (
            <div className={styles.infoBox}>
              Un analista revisará tu solicitud en las próximas horas. Te notificaremos por email cuando haya una resolución.
            </div>
          )}

          {config.ui === "rejected" && (
            <div className={styles.btnRow}>
              <Link to={`/applicant/external-data-summary?id=${id}`}>
                <button className={styles.btnSecondary}>Ver detalle de evaluación <ArrowRight size={13} /></button>
              </Link>
              <Link to="/applicant/apply">
                <button className={styles.btnPrimary}><Plus size={14} /> Nueva solicitud</button>
              </Link>
            </div>
          )}

          {config.ui === "disbursed" && (
            <div className={styles.success}>Tu crédito ha sido desembolsado. Revisa tu cuenta o billetera digital.</div>
          )}

          {POLLING.has(app.status) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "1rem", color: "#94a3b8", fontSize: "0.75rem" }}>
              <RefreshCw size={11} /> Actualizando cada 3 segundos...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
