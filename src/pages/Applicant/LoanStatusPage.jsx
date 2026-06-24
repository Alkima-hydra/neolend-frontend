import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getApplicationsByApplicant } from "../../api/api";
import { getLoanInstallments, registerPayment } from "../../api/apiDisbursement";
import styles from "../shared.module.css";

const INS_CLS = { PENDING: styles.badgeBlue, PAID: styles.badgeGreen, OVERDUE: styles.badgeRed };

export default function LoanStatusPage() {
  const { user } = useAuth();

  const [installments, setInstallments] = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loanId,       setLoanId]       = useState("loan1"); // fallback al seed
  const [loading,      setLoading]      = useState(true);
  const [paying,       setPaying]       = useState(null);
  const [success,      setSuccess]      = useState("");
  const [error,        setError]        = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Obtener loanId real del usuario logueado
        const applicant = await getApplicantByUserId(user.id);
        const apps = await getApplicationsByApplicant(applicant.id);
        const approved = apps.find((a) =>
          a.status === "APPROVED" || a.status === "DISBURSED"
        );
        const resolvedLoanId = approved?.loanId || "loan1";
        setLoanId(resolvedLoanId);

        // 2. Llamar al backend real
        const res = await getLoanInstallments(resolvedLoanId);
        setSummary(res.summary);
        setInstallments(res.data);
      } catch {
        // Fallback al seed del api.js si el backend falla
        try {
          const { getInstallments } = await import("../../api/api");
          const ins = await getInstallments("loan1");
          setInstallments(ins);
        } catch { /* sin cuotas */ }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  async function handlePay(ins) {
    setPaying(ins.id);
    setError("");
    try {
      await registerPayment({
        loan_id:          loanId,
        installment_id:   ins.id,
        amount:           ins.amount,
        payment_method:   "WALLET",
        payment_reference: `PAY-${Date.now()}`,
      });
      // Actualizar estado local inmediatamente
      setInstallments((prev) =>
        prev.map((i) =>
          i.id === ins.id
            ? { ...i, status: "PAID", paid_at: new Date().toISOString() }
            : i
        )
      );
      // Actualizar summary local
      setSummary((prev) =>
        prev
          ? { ...prev, paid: (prev.paid || 0) + 1, pending: (prev.pending || 1) - 1 }
          : prev
      );
      setSuccess(`Cuota #${ins.installment_number ?? ins.installmentNumber} registrada como pagada.`);
    } catch (err) {
      setError(err.message || "Error al registrar el pago");
    } finally {
      setPaying(null);
    }
  }

  // Compatibilidad backend (snake_case) y seed (camelCase)
  const normalize = (ins) => ({
    id:                ins.id,
    installmentNumber: ins.installment_number  ?? ins.installmentNumber,
    dueDate:           ins.due_date            ?? ins.dueDate,
    principalAmount:   ins.principal_amount    ?? ins.principalAmount,
    interestAmount:    ins.interest_amount     ?? ins.interestAmount,
    amount:            ins.amount,
    status:            ins.status,
    paidAt:            ins.paid_at             ?? ins.paidAt,
  });

  const normalized = installments.map(normalize);

  const loan    = { approvedAmount: 450, interestRate: 12.5, termMonths: 6, status: "ACTIVE" };
  const paid    = summary?.paid    ?? normalized.filter((i) => i.status === "PAID").length;
  const total   = normalized.reduce((a, i) => a + Number(i.amount), 0);
  const paidAmt = normalized.filter((i) => i.status === "PAID").reduce((a, i) => a + Number(i.amount), 0);

  if (loading) return <div className={styles.loading}>Cargando préstamo...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estado del Préstamo</h1>
        <p className={styles.pageSubtitle}>Resumen y cronograma de pagos de tu crédito activo</p>
      </div>

      {success && <div className={styles.success}>{success}</div>}
      {error   && <div className={styles.error}>{error}</div>}

      <div className={styles.statGrid}>
        {[
          { label: "Monto aprobado",   value: `USD ${loan.approvedAmount}` },
          { label: "Tasa anual",       value: `${loan.interestRate}%` },
          { label: "Cuotas pagadas",   value: `${paid} / ${loan.termMonths}` },
          { label: "Pagado hasta hoy", value: `USD ${paidAmt.toFixed(2)}` },
          { label: "Saldo pendiente",  value: `USD ${(total - paidAmt).toFixed(2)}` },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ fontSize: "1.25rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CreditCard size={16} /> Progreso de pago
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginBottom: 6 }}>
          <span>{paid} cuotas pagadas</span>
          <span>{loan.termMonths - paid} pendientes</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(paid / loan.termMonths) * 100}%`, background: "#16a34a" }} />
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Cronograma de cuotas</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Vencimiento</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Total cuota</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {normalized.map((ins) => (
                <tr key={ins.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{ins.installmentNumber}</td>
                  <td>{new Date(ins.dueDate).toLocaleDateString()}</td>
                  <td>USD {Number(ins.principalAmount).toFixed(2)}</td>
                  <td>USD {Number(ins.interestAmount).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>USD {Number(ins.amount).toFixed(2)}</td>
                  <td>
                    <span className={`${styles.badge} ${INS_CLS[ins.status] || styles.badgeGray}`}>
                      {ins.status}
                    </span>
                  </td>
                  <td>
                    {ins.status === "PENDING" && (
                      <button
                        className={styles.btnPrimary}
                        style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                        onClick={() => handlePay(ins)}
                        disabled={paying === ins.id}
                      >
                        {paying === ins.id ? "..." : "Pagar"}
                      </button>
                    )}
                    {ins.status === "PAID" && (
                      <span style={{ color: "#16a34a", fontSize: "0.75rem" }}>
                        {ins.paidAt ? new Date(ins.paidAt).toLocaleDateString() : "Pagado"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}