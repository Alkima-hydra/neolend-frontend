import { useState, useEffect, useMemo } from "react";
import { UserPlus, Search, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { getAllUsers, createUser, updateUserStatus, deleteUser } from "../../api/authApi";
import styles from "./UsersPage.module.css";
import shared from "../shared.module.css";

const ROLES = ["SOLICITANTE", "ANALISTA", "GESTOR_COBRANZA", "INVERSIONISTA", "REGULADOR", "COMERCIO", "ADMIN"];

const ROLE_BADGE_CLASS = {
  SOLICITANTE:     shared.badgeBlue,
  ANALISTA:        shared.badgePurple,
  GESTOR_COBRANZA: shared.badgeYellow,
  INVERSIONISTA:   shared.badgeGreen,
  REGULADOR:       shared.badgeGray,
  COMERCIO:        shared.badgeGray,
  ADMIN:           shared.badgeRed,
};

const EMPTY_FORM = { fullName: "", email: "", password: "Neolend@12345!", role: "SOLICITANTE", phone: "" };

export default function UsersPage() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const newUser = await createUser(form);
      setUsers((prev) => [...prev, newUser]);
      setSuccess(`Usuario "${newUser.fullName}" creado correctamente.`);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(user) {
    const next = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateUserStatus(user.id, next);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u));
      setSuccess(`Usuario ${next === "ACTIVE" ? "activado" : "desactivado"} correctamente.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Eliminar a "${user.fullName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSuccess(`Usuario "${user.fullName}" eliminado.`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className={shared.loading}>Cargando usuarios...</div>;

  return (
    <div className={styles.page}>
      <div className={shared.pageHeader}>
        <h1 className={shared.pageTitle}>Gestión de Usuarios</h1>
        <p className={shared.pageSubtitle}>Administración de cuentas y roles del sistema NeoLend</p>
      </div>

      {success && <div className={shared.success}>{success}</div>}
      {error   && <div className={shared.error}>{error}</div>}

      <div className={shared.statGrid}>
        {[
          { label: "Total usuarios",   value: users.length },
          { label: "Activos",          value: users.filter((u) => u.status === "ACTIVE").length },
          { label: "Solicitantes",     value: users.filter((u) => u.role === "SOLICITANTE").length },
          { label: "Staff interno",    value: users.filter((u) => ["ANALISTA", "GESTOR_COBRANZA"].includes(u.role)).length },
        ].map((s) => (
          <div className={shared.statCard} key={s.label}>
            <div className={shared.statValue}>{s.value}</div>
            <div className={shared.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={shared.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por nombre, correo o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={shared.btnPrimary} onClick={() => { setShowModal(true); setError(""); setSuccess(""); }}>
            <UserPlus size={15} />
            Nuevo usuario
          </button>
        </div>

        <div className={shared.tableWrap}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{user.fullName}</td>
                  <td style={{ color: "#64748b", fontSize: "0.8125rem" }}>{user.email}</td>
                  <td>
                    <span className={`${shared.badge} ${ROLE_BADGE_CLASS[user.role] || shared.badgeGray}`}>
                      {user.role?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <span className={`${shared.badge} ${user.status === "ACTIVE" ? shared.badgeGreen : shared.badgeRed}`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button
                        className={styles.iconBtn}
                        title={user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === "ACTIVE"
                          ? <ShieldOff size={13} />
                          : <ShieldCheck size={13} />
                        }
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Eliminar usuario"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Crear nuevo usuario</div>
            <form onSubmit={handleCreate}>
              <div className={styles.formGrid}>
                {error && <div className={shared.error}>{error}</div>}
                <div className={styles.field}>
                  <label>Nombre completo</label>
                  <input type="text" name="fullName" value={form.fullName} onChange={change} placeholder="Nombre Apellido" required />
                </div>
                <div className={styles.field}>
                  <label>Correo electrónico</label>
                  <input type="email" name="email" value={form.email} onChange={change} placeholder="usuario@neolend.com" required />
                </div>
                <div className={styles.field}>
                  <label>Contraseña inicial</label>
                  <input type="text" name="password" value={form.password} onChange={change} required />
                </div>
                <div className={styles.field}>
                  <label>Teléfono (opcional)</label>
                  <input type="text" name="phone" value={form.phone} onChange={change} placeholder="+591 70000000" />
                </div>
                <div className={styles.field}>
                  <label>Rol en el sistema</label>
                  <select name="role" value={form.role} onChange={change}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={shared.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={shared.btnPrimary} disabled={submitting}>
                  <UserPlus size={14} />
                  {submitting ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}