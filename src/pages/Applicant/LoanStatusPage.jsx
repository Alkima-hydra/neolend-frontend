import { useState, useEffect } from "react";
import { getInstallments, registerPayment } from "../../api/api";
import styles from "../shared.module.css";

const STATUS_COLOR = {
  PENDING: styles.badgeBlue,
  PAID: styles.badgeGreen,
  OVERDUE: styles.badgeRed,
};

export default function LoanStatusPage() {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getInstallments("loan1").then(setInstallments).finally(() => setLoading(false));
  }, []);

  async function handlePay(ins) {
    setPaying(ins.id);
    setSuccess("");
    try {
      await registerPayment("loan1", ins.id, ins.amount, "WALLET");
      setInstallments((prev) =>
        prev.map((i) => (i.id === ins.id ? { ...i, status: "PAID", paidAt: new Date().toISOString() } : i))
      );
      setSuccess(`Cuota #${ins.installmentNumber} pagada exitosamente.`);
    } finally {
      setPaying(null);
    }
  }

  const loan = { approvedAmount: 450, interestRate: 12.5, termMonths: 6, status: "ACTIVE" };
  const paid = installments.filter((i) => i.status === "PAID").length;
  const totalPaid = paid * (installments[0]?.amount || 0);

  if (loading) return <div className={styles.loading}>Cargando préstamo...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Estado del Préstamo</h1>
      <p className={styles.pageSubtitle}>Resumen y cuotas de tu crédito activo</p>

      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>USD {loan.approvedAmount}</div>
          <div className={styles.statLabel}>Monto aprobado</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{loan.interestRate}%</div>
          <div className={styles.statLabel}>Tasa anual</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{paid}/{loan.termMonths}</div>
          <div className={styles.statLabel}>Cuotas pagadas</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>USD {totalPaid.toFixed(2)}</div>
          <div className={styles.statLabel}>Total pagado</div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Plan de pagos</h3>
        <div className={styles.progressBar} style={{ marginBottom: "1rem" }}>
          <div className={styles.progressFill} style={{ width: `${(paid / loan.termMonths) * 100}%`, background: "#4ade80" }} />
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vencimiento</th>
              <th>Capital</th>
              <th>Interés</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((ins) => (
              <tr key={ins.id}>
                <td>{ins.installmentNumber}</td>
                <td>{new Date(ins.dueDate).toLocaleDateString()}</td>
                <td>USD {ins.principalAmount.toFixed(2)}</td>
                <td>USD {ins.interestAmount.toFixed(2)}</td>
                <td style={{ fontWeight: 600 }}>USD {ins.amount.toFixed(2)}</td>
                <td><span className={`${styles.badge} ${STATUS_COLOR[ins.status] || styles.badgeGray}`}>{ins.status}</span></td>
                <td>
                  {ins.status === "PENDING" && (
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                      onClick={() => handlePay(ins)}
                      disabled={paying === ins.id}
                    >
                      {paying === ins.id ? "..." : "Pagar"}
                    </button>
                  )}
                  {ins.status === "PAID" && (
                    <span style={{ color: "#4ade80", fontSize: "0.8rem" }}>
                      {ins.paidAt ? new Date(ins.paidAt).toLocaleDateString() : "✓"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
