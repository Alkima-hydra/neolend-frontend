import { useState } from "react";
import { createPaymentAgreement } from "../../api/api";
import styles from "../shared.module.css";

const MOCK_AGREEMENTS = [
  { id: "ag1", loanId: "loan2", agreementType: "EXTENSION", description: "Extensión por dificultades económicas", newDueDate: "2026-08-01", newAmount: 600, status: "ACTIVE", createdAt: "2026-06-15T10:00:00Z" },
];

export default function PaymentAgreementsPage() {
  const [agreements, setAgreements] = useState(MOCK_AGREEMENTS);
  const [form, setForm] = useState({ loanId: "", agreementType: "EXTENSION", description: "", newDueDate: "", newAmount: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const ag = await createPaymentAgreement(form.loanId, form);
      setAgreements((prev) => [...prev, ag]);
      setSuccess("Acuerdo de pago registrado correctamente.");
      setForm({ loanId: "", agreementType: "EXTENSION", description: "", newDueDate: "", newAmount: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Acuerdos de Pago</h1>
      <p className={styles.pageSubtitle}>Gestión de reestructuraciones y acuerdos con clientes en mora</p>

      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Acuerdos activos</h3>
        {agreements.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "1.5rem" }}>Sin acuerdos registrados</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Préstamo</th><th>Tipo</th><th>Descripción</th><th>Nueva fecha</th><th>Nuevo monto</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((ag) => (
                <tr key={ag.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{ag.loanId}</td>
                  <td><span className={`${styles.badge} ${styles.badgeYellow}`}>{ag.agreementType}</span></td>
                  <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{ag.description}</td>
                  <td>{ag.newDueDate ? new Date(ag.newDueDate).toLocaleDateString() : "—"}</td>
                  <td>{ag.newAmount ? `USD ${ag.newAmount}` : "—"}</td>
                  <td><span className={`${styles.badge} ${styles.badgeGreen}`}>{ag.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Registrar nuevo acuerdo</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>ID de préstamo</label>
              <input type="text" name="loanId" value={form.loanId} onChange={change} placeholder="loan1" required />
            </div>
            <div className={styles.field}>
              <label>Tipo de acuerdo</label>
              <select name="agreementType" value={form.agreementType} onChange={change}>
                <option value="EXTENSION">Extensión de plazo</option>
                <option value="REDUCTION">Reducción de cuota</option>
                <option value="RESTRUCTURE">Reestructuración total</option>
                <option value="PAYMENT_PLAN">Plan de pagos</option>
              </select>
            </div>
            <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
              <label>Descripción</label>
              <textarea name="description" value={form.description} onChange={change} rows={2} required />
            </div>
            <div className={styles.field}>
              <label>Nueva fecha de pago</label>
              <input type="date" name="newDueDate" value={form.newDueDate} onChange={change} />
            </div>
            <div className={styles.field}>
              <label>Nuevo monto (USD)</label>
              <input type="number" name="newAmount" value={form.newAmount} onChange={change} placeholder="500" />
            </div>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar acuerdo"}
          </button>
        </div>
      </form>
    </div>
  );
}
