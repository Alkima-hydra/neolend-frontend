// NeoLend simulated API layer — swap fetch calls for real endpoints when backend is ready

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Seed data ────────────────────────────────────────────────────────────────

let USERS = [
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",    email: "juan.solicitante@neolend.com",     password: "demo123", role: "SOLICITANTE",     fullName: "Juan Pérez Solicitante",   status: "ACTIVE",   createdAt: "2026-01-10T08:00:00Z" },
  { id: "u2",    email: "maria.analista@neolend.com",       password: "demo123", role: "ANALISTA",        fullName: "María López Analista",      status: "ACTIVE",   createdAt: "2026-01-10T08:00:00Z" },
  { id: "u3",    email: "carlos.cobranza@neolend.com",      password: "demo123", role: "GESTOR_COBRANZA", fullName: "Carlos Rojas Cobranza",     status: "ACTIVE",   createdAt: "2026-01-10T08:00:00Z" },
  { id: "u4",    email: "fondo.andino@neolend.com",         password: "demo123", role: "INVERSIONISTA",   fullName: "Fondo Andino Capital",      status: "ACTIVE",   createdAt: "2026-01-10T08:00:00Z" },
  { id: "u5",    email: "regulador@superintendencia.gob",   password: "demo123", role: "REGULADOR",       fullName: "Superintendencia Demo",     status: "ACTIVE",   createdAt: "2026-01-10T08:00:00Z" },
  { id: "u6",    email: "neostore@commerce.com",            password: "demo123", role: "COMERCIO",        fullName: "NeoStore Comercio",         status: "ACTIVE",   createdAt: "2026-01-10T08:00:00Z" },
  { id: "u7",    email: "ana.solicitante@neolend.com",      password: "demo123", role: "SOLICITANTE",     fullName: "Ana Gómez Solicitante",     status: "ACTIVE",   createdAt: "2026-01-11T08:00:00Z" },
  { id: "u8",    email: "luis.solicitante@neolend.com",     password: "demo123", role: "SOLICITANTE",     fullName: "Luis Fernández Solicitante",status: "ACTIVE",   createdAt: "2026-01-12T08:00:00Z" },
  { id: "u9",    email: "admin@neolend.com",                password: "demo123", role: "ADMIN",           fullName: "Administrador NeoLend",     status: "ACTIVE",   createdAt: "2026-01-01T08:00:00Z" },
];

const APPLICANTS = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": { id: "a1", userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", documentType: "CI", documentNumber: "LP-1234567", birthDate: "1998-05-14", address: "Av. Arce #123", city: "La Paz", country: "Bolivia", employmentStatus: "DEPENDENT", monthlyIncome: 3200, profileStatus: "COMPLETE" },
  u7: { id: "a2", userId: "u7", documentType: "CI", documentNumber: "CB-7654321", birthDate: "1995-09-20", address: "Calle Bolívar #456", city: "Cochabamba", country: "Bolivia", employmentStatus: "INDEPENDENT", monthlyIncome: 4800, profileStatus: "COMPLETE" },
  u8: { id: "a3", userId: "u8", documentType: "CI", documentNumber: "SC-9988776", birthDate: "2000-11-02", address: "Av. Cristo Redentor #789", city: "Santa Cruz", country: "Bolivia", employmentStatus: "INFORMAL", monthlyIncome: 2100, profileStatus: "COMPLETE" },
};

const IDENTITY_DOCS = {
  a1: { id: "d1", applicantId: "a1", documentFrontUrl: "https://storage.neolend.local/docs/juan-front.jpg", documentBackUrl: "https://storage.neolend.local/docs/juan-back.jpg", selfieUrl: "https://storage.neolend.local/selfies/juan.jpg", validationStatus: "VALIDATED", uploadedAt: "2026-01-10T10:00:00Z" },
  a2: { id: "d2", applicantId: "a2", documentFrontUrl: "https://storage.neolend.local/docs/ana-front.jpg",  documentBackUrl: "https://storage.neolend.local/docs/ana-back.jpg",  selfieUrl: "https://storage.neolend.local/selfies/ana.jpg",  validationStatus: "VALIDATED", uploadedAt: "2026-01-11T10:00:00Z" },
  a3: { id: "d3", applicantId: "a3", documentFrontUrl: "https://storage.neolend.local/docs/luis-front.jpg", documentBackUrl: "https://storage.neolend.local/docs/luis-back.jpg", selfieUrl: "https://storage.neolend.local/selfies/luis.jpg", validationStatus: "PENDING",   uploadedAt: "2026-01-12T10:00:00Z" },
};

const APPLICATIONS = [
  { id: "app1", applicantId: "a1", requestedAmount: 450,  currency: "USD", termMonths: 6,  purpose: "Compra de inventario para pequeño negocio", status: "APPROVED",       createdAt: "2026-06-01T08:00:00Z" },
  { id: "app2", applicantId: "a2", requestedAmount: 1200, currency: "USD", termMonths: 12, purpose: "Capital de trabajo para emprendimiento",     status: "MANUAL_REVIEW", createdAt: "2026-06-03T09:00:00Z" },
  { id: "app3", applicantId: "a3", requestedAmount: 300,  currency: "USD", termMonths: 4,  purpose: "Compra de celular para trabajo",             status: "REJECTED",      createdAt: "2026-06-05T10:00:00Z" },
];

const SCORING = {
  app1: { id: "sc1", applicationId: "app1", applicantId: "a1", score: 742, riskLevel: "LOW", recommendation: "APPROVE", modelVersion: "model-v2-green", shapValues: { utility_payment_score: 0.28, wallet_transaction_score: 0.24, credit_bureau_score: 0.21, ecommerce_score: 0.16, mobile_topup_score: 0.11 }, processingTimeMs: 42800 },
  app2: { id: "sc2", applicationId: "app2", applicantId: "a2", score: 681, riskLevel: "MEDIUM", recommendation: "MANUAL_REVIEW", modelVersion: "model-v2-green", shapValues: { utility_payment_score: 0.20, wallet_transaction_score: 0.22, credit_bureau_score: 0.18, ecommerce_score: 0.17, requested_amount: -0.23 }, processingTimeMs: 53200 },
  app3: { id: "sc3", applicationId: "app3", applicantId: "a3", score: 498, riskLevel: "HIGH", recommendation: "REJECT", modelVersion: "model-v2-green", shapValues: { credit_bureau_score: -0.30, utility_payment_score: -0.25, wallet_transaction_score: -0.21, ecommerce_score: -0.12, mobile_topup_score: -0.12 }, processingTimeMs: 60100 },
};

const DECISIONS = {
  app1: { id: "dec1", applicationId: "app1", decision: "APPROVED",      decisionType: "AUTOMATIC",          reason: "Monto <= USD 500 y score de bajo riesgo." },
  app2: { id: "dec2", applicationId: "app2", decision: "MANUAL_REVIEW", decisionType: "SYSTEM_ESCALATION",  reason: "Monto > USD 500 requiere revisión manual." },
  app3: { id: "dec3", applicationId: "app3", decision: "REJECTED",      decisionType: "AUTOMATIC",          reason: "Score inferior al umbral mínimo y señales de riesgo alto." },
};

const EXTERNAL_DATA = {
  app1: { creditBureauScore: 690, utilityPaymentScore: 88, walletTransactionScore: 91, ecommerceScore: 84, mobileTopupScore: 95, bureau: { source: "SOAP_MAINFRAME", latencyMs: 8200, cacheHit: false }, utilities: { electricity: "ON_TIME", water: "ON_TIME", phone: "ON_TIME" }, wallet: { monthlyTransactions: 34, avgBalance: 540 }, ecommerce: { ordersLast6Months: 18, chargebacks: 0 }, mobileTopups: { frequency: "HIGH", consistency: "STABLE" } },
  app2: { creditBureauScore: 640, utilityPaymentScore: 75, walletTransactionScore: 80, ecommerceScore: 79, mobileTopupScore: 70, bureau: { source: "SOAP_MAINFRAME", latencyMs: 11000, cacheHit: true }, utilities: { electricity: "ON_TIME", water: "LATE_ONCE", phone: "ON_TIME" }, wallet: { monthlyTransactions: 21, avgBalance: 390 }, ecommerce: { ordersLast6Months: 11, chargebacks: 0 }, mobileTopups: { frequency: "MEDIUM", consistency: "STABLE" } },
  app3: { creditBureauScore: 510, utilityPaymentScore: 50, walletTransactionScore: 42, ecommerceScore: 48, mobileTopupScore: 60, bureau: { source: "SOAP_MAINFRAME", latencyMs: 15000, cacheHit: false, circuitBreaker: "HALF_OPEN" }, utilities: { electricity: "LATE", water: "LATE", phone: "LATE" }, wallet: { monthlyTransactions: 5, avgBalance: 45 }, ecommerce: { ordersLast6Months: 2, chargebacks: 1 }, mobileTopups: { frequency: "LOW", consistency: "IRREGULAR" } },
};

const LOAN = { id: "loan1", applicationId: "app1", applicantId: "a1", approvedAmount: 450, interestRate: 12.5, termMonths: 6, status: "ACTIVE", approvedAt: "2026-06-10T12:00:00Z" };

const INSTALLMENTS = [
  { id: "ins1", loanId: "loan1", installmentNumber: 1, dueDate: "2026-07-23", amount: 79.69, principalAmount: 75.00, interestAmount: 4.69, status: "PENDING" },
  { id: "ins2", loanId: "loan1", installmentNumber: 2, dueDate: "2026-08-23", amount: 79.69, principalAmount: 75.00, interestAmount: 4.69, status: "PENDING" },
  { id: "ins3", loanId: "loan1", installmentNumber: 3, dueDate: "2026-09-23", amount: 79.69, principalAmount: 75.00, interestAmount: 4.69, status: "PENDING" },
  { id: "ins4", loanId: "loan1", installmentNumber: 4, dueDate: "2026-10-23", amount: 79.69, principalAmount: 75.00, interestAmount: 4.69, status: "PENDING" },
  { id: "ins5", loanId: "loan1", installmentNumber: 5, dueDate: "2026-11-23", amount: 79.69, principalAmount: 75.00, interestAmount: 4.69, status: "PENDING" },
  { id: "ins6", loanId: "loan1", installmentNumber: 6, dueDate: "2026-12-23", amount: 79.69, principalAmount: 75.00, interestAmount: 4.69, status: "PENDING" },
];

const DISBURSEMENT = { id: "dis1", loanId: "loan1", applicantId: "a1", amount: 450, channel: "WALLET", destinationAccount: "TIGO_MONEY_70000001", status: "COMPLETED", providerReference: "WALLET-TXN-0001", requestedAt: "2026-06-10T12:05:00Z", completedAt: "2026-06-10T12:06:00Z" };

const FRAUD_CHECKS = {
  app1: { id: "f1", documentMatchScore: 96.4, biometricMatchScore: 94.2, stolenIdentityMatch: false, suspiciousPattern: false, fraudRiskLevel: "LOW",    status: "COMPLETED" },
  app2: { id: "f2", documentMatchScore: 91.1, biometricMatchScore: 88.7, stolenIdentityMatch: false, suspiciousPattern: false, fraudRiskLevel: "MEDIUM", status: "COMPLETED" },
  app3: { id: "f3", documentMatchScore: 70.2, biometricMatchScore: 64.9, stolenIdentityMatch: false, suspiciousPattern: true,  fraudRiskLevel: "HIGH",   status: "COMPLETED" },
};

const COURSES = [
  { id: "c1", title: "Uso responsable del crédito",    description: "Curso básico sobre cómo usar créditos pequeños sin sobreendeudarse.", pointsReward: 100, scoreBonus: 10, interestDiscount: 0.5, active: true },
  { id: "c2", title: "Cómo pagar a tiempo",            description: "Planificación de pagos y recordatorios inteligentes.",                  pointsReward: 120, scoreBonus: 12, interestDiscount: 0.75, active: true },
  { id: "c3", title: "Finanzas para emprendedores",    description: "Curso para usuarios que usan créditos como capital de trabajo.",        pointsReward: 150, scoreBonus: 15, interestDiscount: 1.0, active: true },
];

const COURSE_PROGRESS = {
  a1: [{ courseId: "c1", progressPercent: 100, completed: true,  completedAt: "2026-06-15T10:00:00Z" }],
  a2: [{ courseId: "c3", progressPercent: 60,  completed: false, completedAt: null }],
};

const NOTIFICATIONS = [
  { id: "n1", userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", channel: "EMAIL",    recipient: "juan.solicitante@neolend.com", subject: "Crédito aprobado",       message: "Tu crédito fue aprobado y desembolsado correctamente.", status: "SENT",    sentAt: "2026-06-10T12:06:00Z" },
  { id: "n2", userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", channel: "WHATSAPP", recipient: "+59170000001",                  subject: "Recordatorio de pago",   message: "Recuerda que tu primera cuota vence próximamente.",       status: "PENDING", sentAt: null },
];

const AUDIT_EVENTS = [
  { id: "e1", aggregateType: "CreditApplication", eventType: "CreditApplicationCreated", eventData: { requestedAmount: 450, currency: "USD", termMonths: 6 }, hash: "a1b2c3d4", previousHash: null, createdAt: "2026-06-01T08:00:00Z" },
  { id: "e2", aggregateType: "CreditApplication", eventType: "ScoringCompleted",        eventData: { score: 742, riskLevel: "LOW", recommendation: "APPROVE" }, hash: "b2c3d4e5", previousHash: "a1b2c3d4", createdAt: "2026-06-01T08:01:00Z" },
  { id: "e3", aggregateType: "CreditApplication", eventType: "CreditApproved",          eventData: { decision: "APPROVED", decisionType: "AUTOMATIC" }, hash: "c3d4e5f6", previousHash: "b2c3d4e5", createdAt: "2026-06-01T08:02:00Z" },
];

const INVESTOR_METRICS = { totalInvested: 250000, activeLoans: 185, delinquencyRate: 4.8, projectedCashflow: 285000, internalRateReturn: 18.2, riskExposure: 12.5 };

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function login(email, password) {
  await delay();
  const user = USERS.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Credenciales incorrectas");
  const { password: _, ...safe } = user;
  return { user: safe, token: `simulated-jwt-${safe.id}` };
}

export async function register(fullName, email, password, role = "SOLICITANTE") {
  await delay();
  if (USERS.find((u) => u.email === email)) throw new Error("El correo ya está registrado");
  return { message: "Usuario registrado (simulación). Inicia sesión." };
}

export async function getMe(token) {
  await delay(100);
  const id = token?.replace("simulated-jwt-", "");
  const user = USERS.find((u) => u.id === id);
  if (!user) throw new Error("No autenticado");
  const { password: _, ...safe } = user;
  return safe;
}

// ─── Applicant API ────────────────────────────────────────────────────────────

export async function getApplicantByUserId(userId) {
  await delay();
  const applicant = APPLICANTS[userId];
  if (!applicant) throw new Error("Perfil no encontrado");
  return applicant;
}

export async function updateApplicant(applicantId, data) {
  await delay();
  return { ...data, id: applicantId, updated: true };
}

export async function uploadIdentityDocument(applicantId, files) {
  await delay(800);
  return { id: "d_new", applicantId, validationStatus: "PENDING", uploadedAt: new Date().toISOString() };
}

export async function getIdentityDocument(applicantId) {
  await delay();
  return IDENTITY_DOCS[applicantId] || null;
}

// ─── Credit Application API ───────────────────────────────────────────────────

export async function createApplication(applicantId, data) {
  await delay(600);
  return { id: "app_new", applicantId, ...data, status: "CREATED", createdAt: new Date().toISOString() };
}

export async function getApplicationById(id) {
  await delay();
  const app = APPLICATIONS.find((a) => a.id === id);
  if (!app) throw new Error("Solicitud no encontrada");
  return app;
}

export async function getApplicationsByApplicant(applicantId) {
  await delay();
  return APPLICATIONS.filter((a) => a.applicantId === applicantId);
}

export async function getAllApplications() {
  await delay();
  return APPLICATIONS;
}

export async function updateApplicationStatus(id, status) {
  await delay();
  return { id, status, updated: true };
}

// ─── External Data API ────────────────────────────────────────────────────────

export async function getExternalDataSummary(applicationId) {
  await delay(500);
  return EXTERNAL_DATA[applicationId] || null;
}

// ─── Scoring API ──────────────────────────────────────────────────────────────

export async function getScoringResult(applicationId) {
  await delay();
  return SCORING[applicationId] || null;
}

export async function getScoringExplanation(applicationId) {
  await delay();
  const result = SCORING[applicationId];
  if (!result) throw new Error("No hay resultado de scoring");
  return { ...result, explanation: "El modelo usa datos alternativos ponderados con SHAP para explicabilidad regulatoria." };
}

export async function getCurrentModel() {
  await delay(200);
  return { version: "model-v2-green", accuracy: 0.89, trainedAt: "2026-05-01", active: "GREEN" };
}

// ─── Approval API ─────────────────────────────────────────────────────────────

export async function getDecision(applicationId) {
  await delay();
  return DECISIONS[applicationId] || null;
}

export async function submitAnalystDecision(applicationId, decision, reason) {
  await delay(500);
  return { applicationId, decision, reason, decidedAt: new Date().toISOString() };
}

// ─── Disbursement API ─────────────────────────────────────────────────────────

export async function getDisbursement(loanId) {
  await delay();
  return DISBURSEMENT.loanId === loanId ? DISBURSEMENT : null;
}

export async function requestDisbursement(loanId, channel, destination) {
  await delay(700);
  return { id: "dis_new", loanId, channel, destination, status: "PROCESSING", requestedAt: new Date().toISOString() };
}

// ─── Collection API ───────────────────────────────────────────────────────────

export async function getInstallments(loanId) {
  await delay();
  return INSTALLMENTS.filter((i) => i.loanId === loanId);
}

export async function registerPayment(loanId, installmentId, amount, method) {
  await delay(500);
  return { id: "pay_new", loanId, installmentId, amount, method, paidAt: new Date().toISOString() };
}

export async function createPaymentAgreement(loanId, data) {
  await delay(500);
  return { id: "ag_new", loanId, ...data, status: "ACTIVE", createdAt: new Date().toISOString() };
}

export async function getAllLoansForCollection() {
  await delay();
  return [
    { loanId: "loan1", applicantName: "Juan Pérez Solicitante", approvedAmount: 450, status: "ACTIVE", overdueDays: 0 },
    { loanId: "loan2", applicantName: "Ana Gómez Solicitante",  approvedAmount: 1200, status: "OVERDUE", overdueDays: 15 },
  ];
}

// ─── Notification API ─────────────────────────────────────────────────────────

export async function getNotifications(userId) {
  await delay();
  return NOTIFICATIONS.filter((n) => n.userId === userId);
}

export async function sendNotification(userId, channel, subject, message) {
  await delay(400);
  return { id: "n_new", userId, channel, subject, message, status: "SENT", sentAt: new Date().toISOString() };
}

// ─── Investor API ─────────────────────────────────────────────────────────────

export async function getInvestorDashboard() {
  await delay();
  return INVESTOR_METRICS;
}

export async function getPortfolioRisk() {
  await delay();
  return { riskExposure: 12.5, delinquencyRate: 4.8, concentrationRisk: "MEDIUM", topRisks: ["Sector informal", "Zona Santa Cruz", "Plazo > 9 meses"] };
}

export async function getCashflow() {
  await delay();
  return { projected: 285000, collected: 198000, pending: 87000, months: ["Ene","Feb","Mar","Apr","May","Jun"].map((m,i) => ({ month: m, amount: 30000 + i * 5000 })) };
}

// ─── Fraud API ────────────────────────────────────────────────────────────────

export async function getFraudResult(applicationId) {
  await delay();
  return FRAUD_CHECKS[applicationId] || null;
}

export async function getAllFraudChecks() {
  await delay();
  return Object.entries(FRAUD_CHECKS).map(([appId, check]) => {
    const app = APPLICATIONS.find((a) => a.id === appId);
    return { ...check, applicationId: appId, purpose: app?.purpose };
  });
}

// ─── Education API ────────────────────────────────────────────────────────────

export async function getCourses() {
  await delay();
  return COURSES;
}

export async function getCourseProgress(applicantId) {
  await delay();
  return COURSE_PROGRESS[applicantId] || [];
}

export async function completeLesson(applicantId, courseId, progressPercent) {
  await delay(300);
  return { applicantId, courseId, progressPercent, completed: progressPercent >= 100, completedAt: progressPercent >= 100 ? new Date().toISOString() : null };
}

// ─── Audit API ────────────────────────────────────────────────────────────────

export async function getAuditEvents(applicationId) {
  await delay();
  return AUDIT_EVENTS;
}

export async function getDecisionAudit(applicationId) {
  await delay();
  return {
    applicationId,
    inputVariables: { creditBureauScore: 690, utilityPaymentScore: 88, walletTransactionScore: 91, ecommerceScore: 84, mobileTopupScore: 95, requestedAmount: 450 },
    modelWeights: { creditBureauScore: 0.21, utilityPaymentScore: 0.28, walletTransactionScore: 0.24, ecommerceScore: 0.16, mobileTopupScore: 0.11 },
    shapValues: { utilityPaymentScore: 0.28, walletTransactionScore: 0.24, creditBureauScore: 0.21, ecommerceScore: 0.16, mobileTopupScore: 0.11 },
    finalScore: 742, finalDecision: "APPROVED", decisionReason: "Aprobación automática por score alto, bajo riesgo y monto < USD 500.",
    modelVersion: "model-v2-green", signedBySystem: "neolend-approval-service", digitalSignature: "c3d4e5f6a7b8c9d0", createdAt: "2026-06-01T08:02:00Z",
  };
}

export async function getRegulatoryReport() {
  await delay();
  return { reportPeriod: "2026-06", regulatorName: "Superintendencia de Bancos Demo", reportUrl: "https://storage.neolend.local/reports/regulatory-report-2026-06.pdf", generatedAt: "2026-06-23T00:00:00Z", totalApplications: 3, approved: 1, rejected: 1, manualReview: 1, defaultRate: 0, averageScore: 640 };
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  await delay();
  return USERS.map(({ password: _, ...u }) => u);
}

export async function createUser(data) {
  await delay(500);
  if (USERS.find((u) => u.email === data.email)) throw new Error("El correo ya está registrado");
  const newUser = {
    id: `u${Date.now()}`,
    email: data.email,
    password: data.password || "neolend123",
    role: data.role,
    fullName: data.fullName,
    phone: data.phone || null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };
  USERS.push(newUser);
  const { password: _, ...safe } = newUser;
  return safe;
}

export async function updateUserStatus(userId, status) {
  await delay(300);
  const user = USERS.find((u) => u.id === userId);
  if (!user) throw new Error("Usuario no encontrado");
  user.status = status;
  return { id: userId, status };
}

export async function deleteUser(userId) {
  await delay(300);
  const idx = USERS.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Usuario no encontrado");
  USERS.splice(idx, 1);
  return { deleted: true };
}

// ─── Real HTTP API ────────────────────────────────────────────────────────────

const CREDIT_API_BASE = "http://localhost:3002/api";
const EXT_DATA_API_BASE = "http://localhost:3007/api";

async function _http(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function createCreditApplication(data) {
  return _http(`${CREDIT_API_BASE}/credit-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getCreditApplicationById(id) {
  return _http(`${CREDIT_API_BASE}/credit-applications/${id}`);
}

export async function patchCreditApplicationStatus(id, status) {
  return _http(`${CREDIT_API_BASE}/credit-applications/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function getExternalSummary(applicationId) {
  return _http(`${EXT_DATA_API_BASE}/external-data/summary/${applicationId}`);
}
