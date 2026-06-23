import { useState, useEffect } from "react";
import { Upload, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getIdentityDocument, uploadIdentityDocument } from "../../api/api";
import styles from "../shared.module.css";
import docStyles from "./UploadDocumentPage.module.css";

const STATUS_CLASS = {
  VALIDATED: styles.badgeGreen,
  PENDING:   styles.badgeYellow,
  REJECTED:  styles.badgeRed,
};

export default function UploadDocumentPage() {
  const { user } = useAuth();
  const [applicant, setApplicant] = useState(null);
  const [existing, setExisting]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles]         = useState({ front: null, back: null, selfie: null });
  const [success, setSuccess]     = useState("");
  const [error, setError]         = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => { setApplicant(a); return getIdentityDocument(a.id); })
      .then(setExisting).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  function onFileChange(field) {
    return (e) => setFiles({ ...files, [field]: e.target.files[0] });
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!files.front) { setError("El frente del documento es obligatorio"); return; }
    setError(""); setUploading(true);
    try {
      const result = await uploadIdentityDocument(applicant.id, files);
      setSuccess("Documentos enviados. Estado: pendiente de validación biométrica.");
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
            <span className={`${styles.badge} ${STATUS_CLASS[existing.validationStatus]}`}>
              {existing.validationStatus}
            </span>
          </div>
          {existing.uploadedAt && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha de carga</span>
              <span className={styles.infoValue}>{new Date(existing.uploadedAt).toLocaleDateString()}</span>
            </div>
          )}
          {existing.validationStatus === "VALIDATED" && (
            <div className={styles.success} style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={15} />
              Identidad verificada exitosamente. Tu documento es válido.
            </div>
          )}
          {existing.validationStatus === "PENDING" && (
            <div className={styles.infoBox} style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={15} />
              En revisión. El equipo de validación procesará tu documento en 24-48 horas.
            </div>
          )}
        </div>
      )}

      {error   && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleUpload}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Subir documentos</h3>
          <div className={docStyles.uploadGrid}>
            {[
              { key: "front",  label: "Frente del CI",           hint: "Foto clara del frente de tu carnet de identidad", required: true },
              { key: "back",   label: "Reverso del CI",           hint: "Foto clara del reverso de tu carnet" },
              { key: "selfie", label: "Selfie de verificación",   hint: "Foto de tu rostro para validación biométrica" },
            ].map((f) => (
              <div key={f.key} className={`${docStyles.uploadBox} ${files[f.key] ? docStyles.uploadBoxFilled : ""}`}>
                <Upload size={20} color={files[f.key] ? "#1d4ed8" : "#94a3b8"} style={{ marginBottom: "0.5rem" }} />
                <div className={docStyles.uploadLabel}>{f.label}{f.required && " *"}</div>
                <div className={docStyles.uploadHint}>{f.hint}</div>
                <input type="file" accept="image/*" onChange={onFileChange(f.key)} id={`file-${f.key}`} className={docStyles.fileInput} />
                <label htmlFor={`file-${f.key}`} className={docStyles.fileBtn}>
                  {files[f.key] ? files[f.key].name : "Seleccionar archivo"}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={uploading}>
            <Upload size={14} />
            {uploading ? "Subiendo..." : "Enviar documentos"}
          </button>
        </div>
      </form>
    </div>
  );
}
