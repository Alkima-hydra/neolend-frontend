import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

const ROLE_MENUS = {
  SOLICITANTE: [
    { label: "Mi Perfil",           to: "/applicant/profile",              icon: "👤" },
    { label: "Subir Documento",     to: "/applicant/upload-document",       icon: "📄" },
    { label: "Solicitar Crédito",   to: "/applicant/apply",                 icon: "💳" },
    { label: "Estado de Solicitud", to: "/applicant/application-status",    icon: "📊" },
    { label: "Datos Externos",      to: "/applicant/external-data-summary", icon: "🔗" },
    { label: "Resultado",           to: "/applicant/result",                icon: "✅" },
    { label: "Desembolso",          to: "/applicant/disbursement",          icon: "💰" },
    { label: "Mi Préstamo",         to: "/applicant/loan-status",           icon: "📋" },
    { label: "Educación",           to: "/applicant/education",             icon: "🎓" },
  ],
  ANALISTA: [
    { label: "Revisión Manual",     to: "/analyst/review",                  icon: "🔍" },
    { label: "Explicación Scoring", to: "/analyst/scoring-explanation",     icon: "📈" },
  ],
  GESTOR_COBRANZA: [
    { label: "Dashboard Cobranza",  to: "/collections/dashboard",           icon: "📂" },
    { label: "Acuerdos de Pago",    to: "/collections/payment-agreements",  icon: "🤝" },
  ],
  INVERSIONISTA: [
    { label: "Dashboard Inversión", to: "/investor/dashboard",              icon: "📉" },
  ],
  REGULADOR: [
    { label: "Auditoría",           to: "/regulator/audit",                 icon: "🏛️" },
    { label: "Fraude",              to: "/fraud",                           icon: "🛡️" },
  ],
  COMERCIO: [
    { label: "Mi Perfil",           to: "/applicant/profile",              icon: "🏪" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const menu = ROLE_MENUS[user.role] || [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>Menú</div>
      {menu.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.link}${isActive ? " " + styles.active : ""}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
