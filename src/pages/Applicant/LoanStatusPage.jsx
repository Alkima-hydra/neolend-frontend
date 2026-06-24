import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getLoanInstallments,
  registerPayment,
  getLoanByUserId,
} from "../../api/apiDisbursement";
import styles from "../shared.module.css";

const INS_CLS = {
  PENDING:      styles.badgeBlue,
  PAID:         styles.badgeGreen,
  OVERDUE:      styles.badgeRed,
  RESTRUCTURED: styles.badgeGray,
};

const normalize = (ins) => ({
  id:                ins.id,
  installmentNumber: ins.installment_number  ?? ins.installmentNumber,
  dueDate:           ins.due_date            ?? ins.dueDate,
  principalAmount:   parseFloat(ins.principal_amount ?? ins.principalAmount ?? 0),
  interestAmount:    parseFloat(ins.interest_amount  ?? ins.interestAmount  ?? 0),
  amount:            parseFloat(ins.amount),
  status:            ins.status,
  paidAt:            ins.paid_at             ?? ins.paidAt ?? null,
});

export default function LoanStatusPage() {
  const { user } = useAuth();

  const [loan,         setLoan]         = useState(null);
  const [loanId,       setLoanId]       = useState(null);
  const [installments, setInstallments] = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [paying,       setPaying]       = useState(null);
  const [success,      setSuccess]      = useState("");
  const [error,        setError]        = useState("");

  // ── Cargar loan activo + cuotas ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Obtener loan_id real del usuario logueado
        const loanData = await getLoanByUserId(user.id);
        const resolvedLoanId = loanData.loan_id;
        setLoanId(resolvedLoanId);
        setLoan({
          approvedAmount: parseFloat(loanData.approved_amount),
          interestRate:   parseFloat(loanData.interest_rate),
          termMonths:     loanData.term_months,
          status:         loanData.status,
        });

        // 2. Traer cuotas del backend
        const res = await getLoanInstallments(resolvedLoanId);
        setSummary(res.summary);
        setInstallments(res.data.map(normalize));
      } catch (err) {
        setError("No se encontró un préstamo activo para tu cuenta. " + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  // ── Registrar pago ──────────────────────────────────────────
  const handlePay = async (ins) => {
    setPaying(ins.id);
    setError("");
    setSuccess("");
    try {
      await registerPayment({
        loan_id:           loanId,
        installment_id:    ins.id,
        amount:            ins.amount,
        payment_method:    "WALLET",
        payment_reference: `PAY-${Date.now()}`,
      });

      // Actualizar lista local sin recargar
      setInstallments((prev) =>
        prev.map((i) =>
          i.id === ins.id
            ? { ...i, status: "PAID", paidAt: new Date().toISOString() }
            : i
        )
      );
      setSummary((prev) =>
        prev ? { ...prev, paid: (prev.paid || 0) + 1, pending: Math.max((prev.pending || 1) - 1, 0) } : prev
      );
      setSuccess(`✅ Cuota #${ins.installmentNumber} registrada como pagada.`);
    } catch (err) {
      setError(err.message || "Error al registrar el pago");
    } finally {
      setPaying(null);
    }
  };

  // ── Cálculos ────────────────────────────────────────────────
  const paid    = summary?.paid    ?? installments.filter((i) => i.status === "PAID").length;
  const total   = installments.reduce((a, i) => a + i.amount, 0);
  const paidAmt = installments.filter((i) => i.status === "PAID").reduce((a, i) => a + i.amount, 0);
  const termMonths = loan?.termMonths ?? installments.length;

  if (loading) return <div className={styles.loading}>Cargando préstamo...</div>;

  if (error && !loan) return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estado del Préstamo</h1>
      </div>
      <div className={styles.error}>{error}</div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estado del Préstamo</h1>
        <p className={styles.pageSubtitle}>Resumen y cronograma de pagos de tu crédito activo</p>
      </div>

      {success && <div className={styles.success}>{success}</div>}
      {error   && <div className={styles.error}>{error}</div>}

      {/* Stats */}
      <div className={styles.statGrid}>
        {[
          { label: "Monto aprobado",   value: `USD ${loan?.approvedAmount?.toLocaleString() ?? "—"}` },
          { label: "Tasa anual",       value: `${loan?.interestRate ?? "—"}%` },
          { label: "Cuotas pagadas",   value: `${paid} / ${termMonths}` },
          { label: "Pagado hasta hoy", value: `USD ${paidAmt.toFixed(2)}` },
          { label: "Saldo pendiente",  value: `USD ${(total - paidAmt).toFixed(2)}` },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ fontSize: "1.25rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CreditCard size={16} /> Progreso de pago
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginBottom: 6 }}>
          <span>{paid} cuotas pagadas</span>
          <span>{termMonths - paid} pendientes</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${termMonths > 0 ? (paid / termMonths) * 100 : 0}%`, background: "#16a34a" }}
          />
        </div>
      </div>

      {/* Tabla de cuotas */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Cronograma de cuotas</h3>

        {installments.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "1.5rem 0" }}>
            Las cuotas aún no han sido generadas. Completa el desembolso primero.
          </p>
        ) : (
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
                {installments.map((ins) => (
                  <tr key={ins.id}>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{ins.installmentNumber}</td>
                    <td>{new Date(ins.dueDate).toLocaleDateString()}</td>
                    <td>USD {ins.principalAmount.toFixed(2)}</td>
                    <td>USD {ins.interestAmount.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>USD {ins.amount.toFixed(2)}</td>
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
                      {ins.status === "OVERDUE" && (
                        <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>Vencida</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}