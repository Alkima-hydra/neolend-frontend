import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getApplicationsByApplicant } from "../../api/api";
import styles from "../shared.module.css";

const STATUS_MAP = {
  CREATED:          { label: "Creada",               cls: styles.badgeBlue },
  DATA_COLLECTING:  { label: "Recolectando datos",   cls: styles.badgeBlue },
  SCORING:          { label: "En scoring",            cls: styles.badgeYellow },
  APPROVED:         { label: "Aprobada",              cls: styles.badgeGreen },
  REJECTED:         { label: "Rechazada",             cls: styles.badgeRed },
  MANUAL_REVIEW:    { label: "Revisión manual",       cls: styles.badgeYellow },
  DISBURSED:        { label: "Desembolsada",          cls: styles.badgeGreen },
};

export default function ApplicationStatusPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => getApplicationsByApplicant(a.id))
      .then(setApplications)
      .catch(() => setError("No se pudieron cargar las solicitudes"))
      .finally(() => setLoading(false));
  }, [user.id]);

  const newApp = location.state?.newApp;

  if (loading) return <div className={styles.loading}>Cargando solicitudes...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estado de Solicitudes</h1>
        <p className={styles.pageSubtitle}>Seguimiento de tus solicitudes de crédito</p>
      </div>

      {newApp && (
        <div className={styles.success}>
          Solicitud enviada correctamente (ID: {newApp.id}). Iniciando proceso de evaluación.
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}

      {applications.length === 0 ? (
        <div className={styles.card} style={{ textAlign: "center", padding: "2.5rem" }}>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>No tienes solicitudes registradas.</p>
          <Link to="/applicant/apply">
            <button className={styles.btnPrimary}>
              <Plus size={14} /> Nueva solicitud
            </button>
          </Link>
        </div>
      ) : (
        applications.map((app) => {
          const s = STATUS_MAP[app.status] || { label: app.status, cls: styles.badgeGray };
          return (
            <div className={styles.card} key={app.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{app.purpose}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Creada: {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>
              </div>
              <div className={styles.grid3} style={{ marginBottom: "0.75rem" }}>
                {[
                  ["Monto solicitado", `USD ${app.requestedAmount.toLocaleString()}`],
                  ["Plazo",           `${app.termMonths} meses`],
                  ["Moneda",          app.currency],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{v}</div>
                  </div>
                ))}
              </div>
              {app.status === "APPROVED" && (
                <Link to="/applicant/result">
                  <button className={styles.btnPrimary} style={{ fontSize: "0.8125rem" }}>
                    Ver resultado <ArrowRight size={13} />
                  </button>
                </Link>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
