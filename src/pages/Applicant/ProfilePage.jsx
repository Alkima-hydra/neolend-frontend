import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Save, CheckCircle, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { crearApplicant, getApplicant, actualizarApplicant, getProfileStatus, getApplicantByUserId } from "../../api/authApi";
import styles from "../shared.module.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const [applicant, setApplicant]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [form, setForm]                   = useState({});
  const [profileStatus, setProfileStatus] = useState(null);
  const [success, setSuccess]             = useState("");
  const [error, setError]                 = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => {
        if (!a) { setLoading(false); return; }
        setApplicant(a);
        setForm(a);
        return getProfileStatus(a.id);
      })
      .then((status) => { if (status) setProfileStatus(status); })
      .catch(() => setError("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, [user]);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setSuccess(""); setError("");
    try {
      if (!applicant) {
        const nuevo = await crearApplicant(form);
        setApplicant(nuevo);
        setSuccess("Perfil creado correctamente.");
      } else {
        await actualizarApplicant(applicant.id, form);
        setSuccess("Perfil actualizado correctamente.");
      }
      const status = await getProfileStatus(applicant?.id);
      setProfileStatus(status);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Cargando perfil...</div>;

  const isReady = profileStatus?.profile_status === "READY";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mi Perfil</h1>
        <p className={styles.pageSubtitle}>Información personal del solicitante</p>
      </div>

      {isReady && (
        <div className={styles.infoBox} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={15} />
          {profileStatus.msg}{" "}
          <Link to="/applicant/apply" style={{ color: "#1d4ed8", fontWeight: 600 }}>Solicitar crédito</Link>
        </div>
      )}

      {!isReady && profileStatus && (
        <div className={styles.error} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={15} />
          {profileStatus.msg}
        </div>
      )}

      {error   && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSave}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Datos personales</h3>
          <div className={styles.grid2}>
            {[
              { name: "document_type",     label: "Tipo de documento" },
              { name: "document_number",   label: "Número de documento" },
              { name: "birth_date",        label: "Fecha de nacimiento", type: "date" },
              { name: "employment_status", label: "Estado laboral" },
              { name: "monthly_income",    label: "Ingreso mensual (USD)", type: "number" },
            ].map((f) => (
              <div className={styles.field} key={f.name}>
                <label>{f.label}</label>
                <input
                  type={f.type || "text"}
                  name={f.name}
                  value={form[f.name] || ""}
                  onChange={change}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Dirección</h3>
          <div className={styles.grid2}>
            {[
              { name: "address", label: "Dirección" },
              { name: "city",    label: "Ciudad" },
              { name: "country", label: "País" },
            ].map((f) => (
              <div className={styles.field} key={f.name}>
                <label>{f.label}</label>
                <input
                  type="text"
                  name={f.name}
                  value={form[f.name] || ""}
                  onChange={change}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Estado del perfil</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estado actual</span>
            <span className={`${styles.badge} ${isReady ? styles.badgeGreen : styles.badgeYellow}`}>
              {profileStatus?.profile_status || "INCOMPLETE"}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Documento de identidad</span>
            <Link
              to="/applicant/upload-document"
              style={{ color: "#1d4ed8", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Upload size={13} /> Gestionar documento
            </Link>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={saving}>
            <Save size={14} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}