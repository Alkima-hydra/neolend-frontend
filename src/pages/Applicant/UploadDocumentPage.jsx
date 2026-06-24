import { useState, useEffect } from "react";
import { Upload, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, subirDocumento } from "../../api/authApi";
import styles from "../shared.module.css";
import docStyles from "./UploadDocumentPage.module.css";

const STATUS_CLASS = {
  VERIFIED:  styles.badgeGreen,
  PENDING:   styles.badgeYellow,
  REJECTED:  styles.badgeRed,
  REVIEWING: styles.badgeYellow,
};

export default function UploadDocumentPage() {
  const { user } = useAuth();
  const [applicant, setApplicant]   = useState(null);
  const [existing, setExisting]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [urls, setUrls]             = useState({ document_front_url: "", document_back_url: "", selfie_url: "" });
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => {
        if (!a) { setLoading(false); return; }
        setApplicant(a);
        if (a.documents?.length > 0) setExisting(a.documents[0]);
      })
      .catch(() => setError("No se encontró perfil de solicitante"))
      .finally(() => setLoading(false));
  }, [user]);

  function onUrlChange(e) { setUrls({ ...urls, [e.target.name]: e.target.value }); }

  async function handleUpload(e) {
    e.preventDefault();
    if (!applicant) { setError("Primero completa tu perfil personal"); return; }
    if (!urls.document_front_url) { setError("La URL del frente del documento es obligatoria"); return; }
    setError(""); setUploading(true);
    try {
      const result = await subirDocumento(applicant.id, urls);
      setSuccess("Documento enviado. Estado: pendiente de validación.");
      setExisting(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Documento de Identidad</h1>
        <p className={styles.pageSubtitle}>Carga tu carnet de identidad y selfie para verificar tu cuenta</p>
      </div>

      {existing && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Documento registrado</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estado de validación</span>
            <span className={`${styles.badge} ${STATUS_CLASS[existing.validation_status]}`}>
              {existing.validation_status}
            </span>
          </div>
          {existing.uploaded_at && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha de carga</span>
              <span className={styles.infoValue}>{new Date(existing.uploaded_at).toLocaleDateString()}</span>
            </div>
          )}
          {existing.validation_status === "VERIFIED" && (
            <div className={styles.success} style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={15} />
              Identidad verificada exitosamente.
            </div>
          )}
          {existing.validation_status === "PENDING" && (
            <div className={styles.infoBox} style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={15} />
              En revisión. El equipo procesará tu documento en 24-48 horas.
            </div>
          )}
        </div>
      )}

      {error   && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleUpload}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>URLs de documentos</h3>
          <div className={styles.grid2}>
            {[
              { name: "document_front_url", label: "URL frente del CI",          required: true },
              { name: "document_back_url",  label: "URL reverso del CI" },
              { name: "selfie_url",         label: "URL selfie de verificación" },
            ].map((f) => (
              <div className={styles.field} key={f.name}>
                <label>{f.label}{f.required && " *"}</label>
                <input
                  type="url"
                  name={f.name}
                  value={urls[f.name]}
                  onChange={onUrlChange}
                  placeholder="https://storage.ejemplo.com/archivo.jpg"
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={uploading}>
            <Upload size={14} />
            {uploading ? "Enviando..." : "Enviar documentos"}
          </button>
        </div>
      </form>
    </div>
  );
}