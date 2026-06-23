import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getIdentityDocument, uploadIdentityDocument } from "../../api/api";
import styles from "../shared.module.css";
import docStyles from "./UploadDocumentPage.module.css";

export default function UploadDocumentPage() {
  const { user } = useAuth();
  const [applicant, setApplicant] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState({ front: null, back: null, selfie: null });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => {
        setApplicant(a);
        return getIdentityDocument(a.id);
      })
      .then(setExisting)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  function onFileChange(field) {
    return (e) => setFiles({ ...files, [field]: e.target.files[0] });
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!files.front) { setError("El frente del documento es obligatorio"); return; }
    setError("");
    setUploading(true);
    try {
      const result = await uploadIdentityDocument(applicant.id, files);
      setSuccess("Documentos enviados correctamente. Estado: PENDIENTE de validación.");
      setExisting(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const statusColor = {
    VALIDATED: styles.badgeGreen,
    PENDING: styles.badgeYellow,
    REJECTED: styles.badgeRed,
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Carga de Documento de Identidad</h1>
      <p className={styles.pageSubtitle}>Sube tu carnet de identidad y selfie para validar tu cuenta</p>

      {existing && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Documento actual</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estado de validación</span>
            <span className={`${styles.badge} ${statusColor[existing.validationStatus]}`}>
              {existing.validationStatus}
            </span>
          </div>
          {existing.uploadedAt && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Subido el</span>
              <span className={styles.infoValue}>{new Date(existing.uploadedAt).toLocaleDateString()}</span>
            </div>
          )}
          {existing.validationStatus === "VALIDATED" && (
            <div className={styles.success} style={{ marginTop: "0.75rem" }}>
              ✅ Documento validado. Tu identidad ha sido verificada exitosamente.
            </div>
          )}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleUpload}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Subir nuevos documentos</h3>
          <div className={docStyles.uploadGrid}>
            {[
              { key: "front",  label: "Frente del CI *", icon: "🪪", hint: "Imagen clara del frente de tu carnet" },
              { key: "back",   label: "Reverso del CI",  icon: "🔄", hint: "Imagen clara del reverso" },
              { key: "selfie", label: "Selfie de verificación", icon: "🤳", hint: "Foto de tu rostro para biometría" },
            ].map((f) => (
              <div key={f.key} className={docStyles.uploadBox}>
                <div className={docStyles.uploadIcon}>{f.icon}</div>
                <div className={docStyles.uploadLabel}>{f.label}</div>
                <div className={docStyles.uploadHint}>{f.hint}</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange(f.key)}
                  className={docStyles.fileInput}
                  id={`file-${f.key}`}
                />
                <label htmlFor={`file-${f.key}`} className={docStyles.fileBtn}>
                  {files[f.key] ? `✅ ${files[f.key].name}` : "Seleccionar archivo"}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={uploading}>
            {uploading ? "Subiendo documentos..." : "Enviar documentos"}
          </button>
        </div>
      </form>
    </div>
  );
}
