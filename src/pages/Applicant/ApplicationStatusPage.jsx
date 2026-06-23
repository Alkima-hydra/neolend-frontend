import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getApplicationsByApplicant } from "../../api/api";
import styles from "../shared.module.css";

const STATUS_COLORS = {
  CREATED:       styles.badgeBlue,
  DATA_COLLECTING: styles.badgeBlue,
  SCORING:       styles.badgeYellow,
  APPROVED:      styles.badgeGreen,
  REJECTED:      styles.badgeRed,
  MANUAL_REVIEW: styles.badgeYellow,
  DISBURSED:     styles.badgeGreen,
};

const STATUS_LABELS = {
  CREATED: "Creada", DATA_COLLECTING: "Recolectando datos", SCORING: "En scoring",
  APPROVED: "Aprobada", REJECTED: "Rechazada", MANUAL_REVIEW: "Revisión manual", DISBURSED: "Desembolsada",
};

export default function ApplicationStatusPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => getApplicationsByApplicant(a.id))
      .then(setApplications)
      .catch(() => setError("No se encontraron solicitudes"))
      .finally(() => setLoading(false));
  }, [user.id]);

  const newApp = location.state?.newApp;

  if (loading) return <div className={styles.loading}>Cargando solicitudes...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Estado de Solicitudes</h1>
      <p className={styles.pageSubtitle}>Seguimiento de tus solicitudes de crédito</p>

      {newApp && (
        <div className={styles.success}>
          ✅ Solicitud creada exitosamente (ID: {newApp.id}). Iniciando proceso de evaluación.
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {applications.length === 0 ? (
        <div className={styles.card} style={{ textAlign: "center", color: "#64748b" }}>
          No tienes solicitudes aún.{" "}
          <Link to="/applicant/apply" style={{ color: "#38bdf8" }}>Solicita tu primer crédito →</Link>
        </div>
      ) : (
        applications.map((app) => (
          <div className={styles.card} key={app.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{app.purpose}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Creada: {new Date(app.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`${styles.badge} ${STATUS_COLORS[app.status] || styles.badgeGray}`}>
                {STATUS_LABELS[app.status] || app.status}
              </span>
            </div>
            <div className={styles.grid3}>
              <div className={styles.infoRow} style={{ flexDirection: "column", gap: 2 }}>
                <span className={styles.infoLabel}>Monto solicitado</span>
                <span className={styles.infoValue}>USD {app.requestedAmount.toLocaleString()}</span>
              </div>
              <div className={styles.infoRow} style={{ flexDirection: "column", gap: 2 }}>
                <span className={styles.infoLabel}>Plazo</span>
                <span className={styles.infoValue}>{app.termMonths} meses</span>
              </div>
              <div className={styles.infoRow} style={{ flexDirection: "column", gap: 2 }}>
                <span className={styles.infoLabel}>Moneda</span>
                <span className={styles.infoValue}>{app.currency}</span>
              </div>
            </div>
            {app.status === "APPROVED" && (
              <div className={styles.btnRow}>
                <Link to="/applicant/result" style={{ textDecoration: "none" }}>
                  <button className={styles.btnPrimary}>Ver resultado →</button>
                </Link>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
