import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { getInstallments, registerPayment } from "../../api/api";
import styles from "../shared.module.css";

const INS_CLS = { PENDING: styles.badgeBlue, PAID: styles.badgeGreen, OVERDUE: styles.badgeRed };

export default function LoanStatusPage() {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [paying, setPaying]             = useState(null);
  const [success, setSuccess]           = useState("");

  useEffect(() => {
    getInstallments("loan1").then(setInstallments).finally(() => setLoading(false));
  }, []);

  async function handlePay(ins) {
    setPaying(ins.id);
    try {
      await registerPayment("loan1", ins.id, ins.amount, "WALLET");
      setInstallments((prev) =>
        prev.map((i) => i.id === ins.id ? { ...i, status: "PAID", paidAt: new Date().toISOString() } : i)
      );
      setSuccess(`Cuota #${ins.installmentNumber} registrada como pagada.`);
    } finally {
      setPaying(null);
    }
  }

  const loan   = { approvedAmount: 450, interestRate: 12.5, termMonths: 6, status: "ACTIVE" };
  const paid   = installments.filter((i) => i.status === "PAID").length;
  const total  = installments.reduce((a, i) => a + i.amount, 0);
  const paidAmt = installments.filter((i) => i.status === "PAID").reduce((a, i) => a + i.amount, 0);

  if (loading) return <div className={styles.loading}>Cargando préstamo...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estado del Préstamo</h1>
        <p className={styles.pageSubtitle}>Resumen y cronograma de pagos de tu crédito activo</p>
      </div>

      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.statGrid}>
        {[
          { label: "Monto aprobado",    value: `USD ${loan.approvedAmount}` },
          { label: "Tasa anual",        value: `${loan.interestRate}%` },
          { label: "Cuotas pagadas",    value: `${paid} / ${loan.termMonths}` },
          { label: "Pagado hasta hoy",  value: `USD ${paidAmt.toFixed(2)}` },
          { label: "Saldo pendiente",   value: `USD ${(total - paidAmt).toFixed(2)}` },
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
