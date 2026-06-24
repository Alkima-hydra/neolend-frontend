import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, Wallet, Building2, MapPin, Banknote } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getApplicantByUserId,
  getApplicationsByApplicant,
  getDisbursement,
} from "../../api/api";
import {
  disbursementByWallet,
  disbursementByBank,
  disbursementByCorrespondent,
  getDisbursementsByLoanId,
  generateInstallments,
} from "../../api/apiDisbursement";
import styles from "../shared.module.css";

// Loan seed del api.js (fallback si no viene del backend)
const LOAN_SEED = {
  id: "loan1",
  applicationId: "app1",
  applicantId: "a1",
  approvedAmount: 450,
  interestRate: 12.5,
  termMonths: 6,
  status: "ACTIVE",
  approvedAt: "2026-06-10T12:00:00Z",
};

const CHANNELS = [
  {
    key: "WALLET",
    label: "Billetera Digital",
    icon: Wallet,
    placeholder: "Ej: tigo-money-591-70000000",
    description: "Tigo Money, PayPal u otra billetera digital",
  },
  {
    key: "BANK",
    label: "Cuenta Bancaria",
    icon: Building2,
    placeholder: "Ej: 4012-0001-0023-4567",
    description: "Transferencia directa a tu cuenta bancaria",
  },
  {
    key: "CORRESPONDENT",
    label: "Corresponsal Bancario",
    icon: MapPin,
    placeholder: "Ej: CORRESPONSAL-LA-PAZ-001 (opcional)",
    description: "Retiro en efectivo en punto corresponsal",
  },
  {
    key: "CASH",
    label: "Efectivo",
    icon: Banknote,
    placeholder: "No requiere cuenta destino",
    description: "Retiro directo en oficina NeoLend",
  },
];

const STATUS_ICON = {
  COMPLETED:  { icon: CheckCircle, color: "#22c55e", label: "Desembolsado" },
  PROCESSING: { icon: Clock,       color: "#f59e0b", label: "Procesando"   },
  PENDING:    { icon: Clock,       color: "#94a3b8", label: "Pendiente"    },
  FAILED:     { icon: AlertCircle, color: "#ef4444", label: "Fallido"      },
};

export default function DisbursementPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [loan,            setLoan]            = useState(null);
  const [disbursement,    setDisbursement]    = useState(null);
  const [selectedChannel, setSelectedChannel] = useState("WALLET");
  const [destination,     setDestination]     = useState("");
  const [loading,         setLoading]         = useState(true);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");

  // ── Cargar préstamo y desembolso existente ──────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Obtener applicant del usuario logueado
        const applicant = await getApplicantByUserId(user.id);

        // 2. Buscar solicitud APPROVED
        const apps = await getApplicationsByApplicant(applicant.id);
        const approved = apps.find((a) => a.status === "APPROVED" || a.status === "DISBURSED");

        if (!approved) {
          setError("No tienes una solicitud aprobada para desembolsar.");
          setLoading(false);
          return;
        }

        // 3. Usar loan seed (en producción vendría del approval-service)
        //    Si el backend devuelve loan_id en la application, úsalo aquí
        const loanId = approved.loanId || LOAN_SEED.id;
        setLoan({ ...LOAN_SEED, id: loanId, approvedAmount: approved.requestedAmount, termMonths: approved.termMonths });

        // 4. Ver si ya existe un desembolso
        try {
          const existing = await getDisbursementsByLoanId(loanId);
          if (existing && existing.length > 0) {
            setDisbursement(existing[0]);
          }
        } catch {
          // No hay desembolso aún, es normal
        }
      } catch (err) {
        // Fallback al seed data
        setLoan(LOAN_SEED);
        try {
          const existing = await getDisbursementsByLoanId(LOAN_SEED.id);
          if (existing && existing.length > 0) setDisbursement(existing[0]);
        } catch { /* sin desembolso previo */ }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  // ── Enviar desembolso ───────────────────────────────────────
  const handleSubmit = async () => {
    if (!loan) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    const payload = {
      loan_id:             loan.id,
      applicant_id:        loan.applicantId,
      amount:              loan.approvedAmount,
      destination_account: destination || undefined,
    };

    try {
      let result;
      if (selectedChannel === "WALLET")       result = await disbursementByWallet(payload);
      else if (selectedChannel === "BANK")    result = await disbursementByBank(payload);
      else                                    result = await disbursementByCorrespondent(payload);

      setDisbursement(result);

      // Generar cuotas automáticamente después del desembolso
      try {
        await generateInstallments({
          loan_id:     loan.id,
          principal:   loan.approvedAmount,
          annual_rate: loan.interestRate || 18,
          term_months: loan.termMonths,
        });
        setSuccess("¡Desembolso completado! Tus cuotas han sido generadas. Redirigiendo...");
      } catch {
        setSuccess("¡Desembolso completado! Redirigiendo al estado de tu préstamo...");
      }

      setTimeout(() => navigate("/applicant/loan-status"), 2500);
    } catch (err) {
      setError(err.message || "Error al procesar el desembolso. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return <div className={styles.loading}>Cargando información del préstamo...</div>;

  // ── Si ya fue desembolsado ──────────────────────────────────
  if (disbursement && disbursement.status === "COMPLETED") {
    const st = STATUS_ICON.COMPLETED;
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Desembolso</h1>
          <p className={styles.pageSubtitle}>Estado de tu crédito aprobado</p>
        </div>

        <div className={styles.card} style={{ textAlign: "center", padding: "2.5rem" }}>
          <CheckCircle size={56} color="#22c55e" style={{ marginBottom: "1rem" }} />
          <h2 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>¡Crédito Desembolsado!</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            Tu dinero fue enviado exitosamente
          </p>

          <div className={styles.grid3} style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            {[
              ["Monto",      `USD ${disbursement.amount?.toLocaleString() || loan?.approvedAmount}`],
              ["Canal",      disbursement.channel],
              ["Referencia", disbursement.provider_reference || disbursement.providerReference || "—"],
              ["Estado",     st.label],
              ["Completado", disbursement.completed_at
                ? new Date(disbursement.completed_at).toLocaleString()
                : disbursement.completedAt
                  ? new Date(disbursement.completedAt).toLocaleString()
                  : "—"],
              ["Destino",    disbursement.destination_account || disbursement.destinationAccount || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{v}</div>
              </div>
            ))}
          </div>

          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/applicant/loan-status")}
          >
            Ver mis cuotas →
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario de desembolso ────────────────────────────────
  const channel = CHANNELS.find((c) => c.key === selectedChannel);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Desembolso</h1>
        <p className={styles.pageSubtitle}>Elige cómo recibir tu crédito aprobado</p>
      </div>

      {/* Resumen del préstamo */}
      {loan && (
        <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
            Resumen del crédito aprobado
          </div>
          <div className={styles.grid3}>
            {[
              ["Monto aprobado",  `USD ${loan.approvedAmount?.toLocaleString()}`],
              ["Plazo",           `${loan.termMonths} meses`],
              ["Tasa anual",      `${loan.interestRate || 18}%`],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selección de canal */}
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
          ¿Cómo quieres recibir tu dinero?
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {CHANNELS.map(({ key, label, icon: Icon, description }) => {
            const active = selectedChannel === key;
            return (
              <button
                key={key}
                onClick={() => { setSelectedChannel(key); setDestination(""); }}
                style={{
                  border:          `2px solid ${active ? "#6366f1" : "#e2e8f0"}`,
                  borderRadius:    "0.75rem",
                  padding:         "1rem",
                  background:      active ? "#f0f0ff" : "#fff",
                  cursor:          "pointer",
                  textAlign:       "left",
                  transition:      "all 0.15s",
                }}
              >
                <Icon size={20} color={active ? "#6366f1" : "#94a3b8"} style={{ marginBottom: "0.4rem" }} />
                <div style={{ fontWeight: 600, color: active ? "#6366f1" : "#0f172a", fontSize: "0.85rem" }}>{label}</div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.2rem" }}>{description}</div>
              </button>
            );
          })}
        </div>

        {/* Campo destino (no para CASH) */}
        {selectedChannel !== "CASH" && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.4rem" }}>
              {selectedChannel === "WALLET" ? "Número o alias de billetera" :
               selectedChannel === "BANK"   ? "Número de cuenta bancaria" :
                                              "Código de corresponsal (opcional)"}
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={channel?.placeholder}
              style={{
                width:        "100%",
                padding:      "0.625rem 0.875rem",
                border:       "1.5px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize:     "0.875rem",
                outline:      "none",
                boxSizing:    "border-box",
              }}
            />
          </div>
        )}

        {error   && <div className={styles.error}   style={{ marginBottom: "0.75rem" }}>{error}</div>}
        {success && <div className={styles.success} style={{ marginBottom: "0.75rem" }}>{success}</div>}

        <button
          className={styles.btnPrimary}
          onClick={handleSubmit}
          disabled={submitting || (selectedChannel !== "CASH" && !destination.trim())}
          style={{ width: "100%", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Procesando desembolso..." : `Recibir USD ${loan?.approvedAmount?.toLocaleString() || "—"} por ${channel?.label}`}
        </button>
      </div>

      <p style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
        Al confirmar, recibirás una notificación por WhatsApp y Email con la referencia del desembolso.
      </p>
    </div>
  );
}