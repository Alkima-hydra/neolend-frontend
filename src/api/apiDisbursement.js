const BASE_URL =  "http://localhost:3005";

// ──────────────────────────────────────────────
// DISBURSEMENTS
// ──────────────────────────────────────────────

export const disbursementByWallet = async ({ loan_id, applicant_id, amount, destination_account }) => {
  const res = await fetch(`${BASE_URL}/api/disbursements/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, applicant_id, amount, destination_account }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error en desembolso por wallet");
  return data.data;
};

export const disbursementByBank = async ({ loan_id, applicant_id, amount, destination_account }) => {
  const res = await fetch(`${BASE_URL}/api/disbursements/bank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, applicant_id, amount, destination_account }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error en desembolso por banco");
  return data.data;
};

export const disbursementByCorrespondent = async ({ loan_id, applicant_id, amount, destination_account }) => {
  const res = await fetch(`${BASE_URL}/api/disbursements/correspondent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, applicant_id, amount, destination_account }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error en desembolso por corresponsal");
  return data.data;
};

export const getDisbursementsByLoanId = async (loanId) => {
  const res = await fetch(`${BASE_URL}/api/disbursements/${loanId}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al obtener desembolsos");
  return data.data;
};

export const updateDisbursementStatus = async (disbursementId, status) => {
  const res = await fetch(`${BASE_URL}/api/disbursements/${disbursementId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al actualizar estado");
  return data.data;
};

// ──────────────────────────────────────────────
// COLLECTIONS
// ──────────────────────────────────────────────

export const getLoanInstallments = async (loanId) => {
  const res = await fetch(`${BASE_URL}/api/collections/loan/${loanId}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al obtener cuotas");
  return data; // devuelve { summary, data: installments }
};

export const registerPayment = async ({ loan_id, installment_id, amount, payment_method, payment_reference }) => {
  const res = await fetch(`${BASE_URL}/api/collections/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, installment_id, amount, payment_method, payment_reference }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al registrar pago");
  return data.data;
};

export const createPaymentAgreement = async ({ loan_id, agreement_type, description, new_due_date, new_amount }) => {
  const res = await fetch(`${BASE_URL}/api/collections/payment-agreement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, agreement_type, description, new_due_date, new_amount }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al crear acuerdo");
  return data.data;
};

export const restructureLoan = async ({ loan_id, new_term_months, new_principal, annual_rate, reason }) => {
  const res = await fetch(`${BASE_URL}/api/collections/restructure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, new_term_months, new_principal, annual_rate, reason }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al reestructurar préstamo");
  return data.data;
};

export const reportToBureau = async ({ loan_id, applicant_id, days_overdue, amount_overdue }) => {
  const res = await fetch(`${BASE_URL}/api/collections/report-to-bureau`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, applicant_id, days_overdue, amount_overdue }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al reportar al buró");
  return data.data;
};

export const generateInstallments = async ({ loan_id, principal, annual_rate = 18, term_months, start_date }) => {
  const res = await fetch(`${BASE_URL}/api/collections/generate-installments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loan_id, principal, annual_rate, term_months, start_date }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al generar cuotas");
  return data.data;
};

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────

export const getNotificationHistory = async (userId, page = 1, limit = 20) => {
  const res = await fetch(`${BASE_URL}/api/notifications/history/${userId}?page=${page}&limit=${limit}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al obtener notificaciones");
  return data; // devuelve { total, page, total_pages, data: notifications }
};

export const sendManualNotification = async ({ channel, recipient, subject, message }) => {
  const res = await fetch(`${BASE_URL}/api/notifications/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, recipient, subject, message }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Error al enviar notificación");
  return data.data;
};