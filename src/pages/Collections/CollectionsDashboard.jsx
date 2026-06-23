import { useState, useEffect } from "react";
import { getAllLoansForCollection, getInstallments, registerPayment, sendNotification } from "../../api/api";
import styles from "../shared.module.css";

export default function CollectionsDashboard() {
  const [loans, setLoans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifSent, setNotifSent] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getAllLoansForCollection().then(setLoans).finally(() => setLoading(false));
  }, []);

  async function selectLoan(loan) {
    setSelected(loan);
    setSuccess("");
    const ins = await getInstallments(loan.loanId);
    setInstallments(ins);
  }

  async function handleReminder(loan) {
    await sendNotification(loan.loanId, "WHATSAPP", "Recordatorio de pago", `Tu cuota vence pronto. Monto: USD ${loan.approvedAmount}`);
    setNotifSent((prev) => ({ ...prev, [loan.loanId]: true }));
    setSuccess(`Recordatorio enviado para préstamo ${loan.loanId}`);
  }

  async function handlePay(ins) {
    await registerPayment(selected.loanId, ins.id, ins.amount, "WALLET");
    setInstallments((prev) => prev.map((i) => i.id === ins.id ? { ...i, status: "PAID" } : i));
    setSuccess(`Cuota #${ins.installmentNumber} marcada como pagada`);
  }

  if (loading) return <div className={styles.loading}>Cargando cartera...</div>;

  return (
    <div className={styles.page} style={{ maxWidth: 1100 }}>
      <h1 className={styles.pageTitle}>Dashboard de Cobranza</h1>
      <p className={styles.pageSubtitle}>Gestión de pagos y seguimiento de cartera</p>

      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{loans.length}</div>
          <div className={styles.statLabel}>Préstamos totales</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: "#f87171" }}>
            {loans.filter((l) => l.status === "OVERDUE").length}
          </div>
          <div className={styles.statLabel}>En mora</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: "#4ade80" }}>
            {loans.filter((l) => l.status === "ACTIVE").length}
          </div>
          <div className={styles.statLabel}>Al día</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.25rem" }}>
        <div className={styles.card} style={{ padding: "1rem" }}>
          <div className={styles.cardTitle}>Cartera</div>
          {loans.map((loan) => (
            <div
              key={loan.loanId}
              onClick={() => selectLoan(loan)}
              style={{
                padding: "0.75rem", borderRadius: 8, cursor: "pointer", marginBottom: "0.5rem",
                background: selected?.loanId === loan.loanId ? "#0f2744" : "transparent",
                border: `1px solid ${selected?.loanId === loan.loanId ? "#38bdf8" : "#334155"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
                  {loan.applicantName}
                </span>
                <span className={`${styles.badge} ${loan.status === "OVERDUE" ? styles.badgeRed : styles.badgeGreen}`}>
                  {loan.status}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                USD {loan.approvedAmount}
                {loan.overdueDays > 0 && <span style={{ color: "#f87171" }}> · {loan.overdueDays} días de mora</span>}
              </div>
              <button
                className={styles.btnSecondary}
                style={{ marginTop: "0.5rem", padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={(e) => { e.stopPropagation(); handleReminder(loan); }}
                disabled={notifSent[loan.loanId]}
              >
                {notifSent[loan.loanId] ? "✅ Enviado" : "📱 Recordatorio"}
              </button>
            </div>
          ))}
        </div>

        <div>
          {!selected ? (
            <div className={styles.card} style={{ textAlign: "center", color: "#475569", padding: "3rem" }}>
              Selecciona un préstamo para ver el plan de pagos
            </div>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Cuotas — {selected.applicantName}</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((ins) => (
                    <tr key={ins.id}>
                      <td>{ins.installmentNumber}</td>
                      <td>{new Date(ins.dueDate).toLocaleDateString()}</td>
                      <td>USD {ins.amount.toFixed(2)}</td>
                      <td>
                        <span className={`${styles.badge} ${ins.status === "PAID" ? styles.badgeGreen : styles.badgeBlue}`}>
                          {ins.status}
                        </span>
                      </td>
                      <td>
                        {ins.status === "PENDING" && (
                          <button
                            className={styles.btnPrimary}
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                            onClick={() => handlePay(ins)}
                          >
                            Registrar pago
                          </button>
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
    </div>
  );
}
