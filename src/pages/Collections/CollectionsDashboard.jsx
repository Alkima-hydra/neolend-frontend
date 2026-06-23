import { useState, useEffect } from "react";
import { Bell, CreditCard } from "lucide-react";
import { getAllLoansForCollection, getInstallments, registerPayment, sendNotification } from "../../api/api";
import styles from "../shared.module.css";

export default function CollectionsDashboard() {
  const [loans, setLoans]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [notifSent, setNotifSent] = useState({});
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    getAllLoansForCollection().then(setLoans).finally(() => setLoading(false));
  }, []);

  async function selectLoan(loan) {
    setSelected(loan); setSuccess("");
    const ins = await getInstallments(loan.loanId);
    setInstallments(ins);
  }

  async function handleReminder(loan) {
    await sendNotification(loan.loanId, "WHATSAPP", "Recordatorio de pago", `Tu cuota vence pronto.`);
    setNotifSent((prev) => ({ ...prev, [loan.loanId]: true }));
    setSuccess(`Recordatorio enviado a ${loan.applicantName}`);
  }

  async function handlePay(ins) {
    await registerPayment(selected.loanId, ins.id, ins.amount, "WALLET");
    setInstallments((prev) => prev.map((i) => i.id === ins.id ? { ...i, status: "PAID" } : i));
    setSuccess(`Cuota #${ins.installmentNumber} registrada como pagada.`);
  }

  if (loading) return <div className={styles.loading}>Cargando cartera...</div>;

  const overdue = loans.filter((l) => l.status === "OVERDUE").length;
  const active  = loans.filter((l) => l.status === "ACTIVE").length;

  return (
    <div className={styles.page} style={{ maxWidth: 1100 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard de Cobranza</h1>
        <p className={styles.pageSubtitle}>Seguimiento y gestión de pagos de la cartera activa</p>
      </div>

      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.statGrid}>
        {[
          { label: "Préstamos totales", value: loans.length },
          { label: "Al día",            value: active,  color: "#16a34a" },
          { label: "En mora",           value: overdue, color: "#dc2626" },
          { label: "Tasa de mora",      value: `${((overdue / loans.length) * 100).toFixed(1)}%`, color: overdue > 0 ? "#dc2626" : "#16a34a" },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ color: s.color || "#1d4ed8", fontSize: "1.5rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem" }}>
        <div className={styles.card} style={{ padding: "1rem", alignSelf: "start" }}>
          <div className={styles.cardTitle}>Cartera de préstamos</div>
          {loans.map((loan) => (
            <div
              key={loan.loanId}
              onClick={() => selectLoan(loan)}
              style={{
                padding: "0.875rem", borderRadius: 8, cursor: "pointer", marginBottom: "0.5rem",
                background: selected?.loanId === loan.loanId ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${selected?.loanId === loan.loanId ? "#bfdbfe" : "#e2e8f0"}`,
                transition: "all 0.12s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{loan.applicantName}</span>
                <span className={`${styles.badge} ${loan.status === "OVERDUE" ? styles.badgeRed : styles.badgeGreen}`}>
                  {loan.status}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                USD {loan.approvedAmount}
                {loan.overdueDays > 0 && <span style={{ color: "#dc2626" }}> · {loan.overdueDays}d mora</span>}
              </div>
              <button
                className={styles.btnSecondary}
                style={{ padding: "4px 10px", fontSize: "0.75rem", width: "100%" }}
                onClick={(e) => { e.stopPropagation(); handleReminder(loan); }}
                disabled={notifSent[loan.loanId]}
              >
                <Bell size={12} />
                {notifSent[loan.loanId] ? "Enviado" : "Enviar recordatorio"}
              </button>
            </div>
          ))}
        </div>

        <div>
          {!selected ? (
            <div className={styles.card} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <CreditCard size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
              Selecciona un préstamo para ver el plan de cuotas
            </div>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Cuotas — {selected.applicantName}</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>#</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {installments.map((ins) => (
                      <tr key={ins.id}>
                        <td style={{ fontWeight: 600 }}>{ins.installmentNumber}</td>
                        <td>{new Date(ins.dueDate).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>USD {ins.amount.toFixed(2)}</td>
                        <td>
                          <span className={`${styles.badge} ${ins.status === "PAID" ? styles.badgeGreen : styles.badgeBlue}`}>
                            {ins.status}
                          </span>
                        </td>
                        <td>
                          {ins.status === "PENDING" && (
                            <button className={styles.btnPrimary} style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => handlePay(ins)}>
                              Registrar pago
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
