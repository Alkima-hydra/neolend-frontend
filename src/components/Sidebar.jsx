import { NavLink } from "react-router-dom";
import {
  User, FileText, CreditCard, BarChart2, Database, CheckCircle,
  DollarSign, BookOpen, Search, TrendingUp, Layers, Handshake,
  PieChart, Shield, ClipboardList, Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

const ROLE_MENUS = {
  SOLICITANTE: [
    { label: "Mi Perfil",             to: "/applicant/profile",              Icon: User },
    { label: "Solicitar Crédito",     to: "/applicant/apply",                Icon: CreditCard },
    { label: "Estado de Solicitud",   to: "/applicant/application-status",   Icon: BarChart2 },
    { label: "Datos Externos",        to: "/applicant/external-data-summary",Icon: Database },
    { label: "Resultado",             to: "/applicant/result",               Icon: CheckCircle },
    { label: "Desembolso",            to: "/applicant/disbursement",         Icon: DollarSign },
    { label: "Mi Préstamo",           to: "/applicant/loan-status",          Icon: FileText },
    { label: "Educación Financiera",  to: "/applicant/education",            Icon: BookOpen },
  ],
  ANALISTA: [
    { label: "Revisión Manual",       to: "/analyst/review",                 Icon: Search },
    { label: "Explicación Scoring",   to: "/analyst/scoring-explanation",    Icon: TrendingUp },
  ],
  GESTOR_COBRANZA: [
    { label: "Cartera de Cobranza",   to: "/collections/dashboard",          Icon: Layers },
    { label: "Acuerdos de Pago",      to: "/collections/payment-agreements", Icon: Handshake },
  ],
  INVERSIONISTA: [
    { label: "Dashboard Inversión",   to: "/investor/dashboard",             Icon: PieChart },
  ],
  REGULADOR: [
    { label: "Auditoría",             to: "/regulator/audit",                Icon: ClipboardList },
    { label: "Detección Fraude",      to: "/fraud",                          Icon: Shield },
  ],
  COMERCIO: [
    { label: "Mi Perfil",             to: "/applicant/profile",              Icon: User },
  ],
  ADMIN: [
    { label: "Gestión de Usuarios",   to: "/admin/users",                    Icon: Users },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const menu = ROLE_MENUS[user.role] || [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>Navegación</div>
      {menu.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.link}${isActive ? " " + styles.active : ""}`
          }
        >
          <item.Icon className={styles.icon} />
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
