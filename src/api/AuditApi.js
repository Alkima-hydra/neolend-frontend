// API real → AuditApi-service (puerto 3004)
// Investor, Fraud, Education, Audit

const BASE = 'http://localhost:3004/api';

const getToken = () => localStorage.getItem('neolend_token');

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeader(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en el servidor');
  return data;
}

// ─── INVESTOR ─────────────────────────────────────────────────────────────────

export async function getInvestorDashboard() {
  const { data } = await request('GET', '/investors/dashboard');
  const m = data.metrics || {};
  return {
    totalInvested: parseFloat(m.total_invested || 0),
    activeLoans: m.active_loans || 0,
    delinquencyRate: parseFloat(m.delinquency_rate || 0),
    projectedCashflow: parseFloat(m.projected_cashflow || 0),
    internalRateReturn: parseFloat(m.internal_rate_return || 0),
    riskExposure: parseFloat(m.risk_exposure || 0),
  };
}

export async function getPortfolioRisk() {
  const { data } = await request('GET', '/investors/portfolio-risk');
  return {
    riskExposure: parseFloat(data.risk_exposure || 0),
    delinquencyRate: parseFloat(data.delinquency_rate || 0),
    concentrationRisk: 'MEDIUM',
    topRisks: ['Sector informal', 'Zona Santa Cruz', 'Plazo > 9 meses'],
  };
}

export async function getCashflow() {
  const { data } = await request('GET', '/investors/cashflow');
  const projected = parseFloat(data.projected_cashflow || 0);
  const collected = Math.round(projected * 0.69);
  const pending = projected - collected;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((month, i) => ({
    month,
    amount: Math.round((projected / 6) * (0.8 + i * 0.06)),
  }));
  return { projected, collected, pending, months };
}

// ─── FRAUD ───────────────────────────────────────────────────────────────────

export async function getAllFraudChecks() {
  const { data } = await request('GET', '/fraud/all');
  return data;
}

export async function getFraudResult(applicationId) {
  const { data } = await request('GET', `/fraud/result/${applicationId}`);
  return {
    documentMatchScore: parseFloat(data.document_match_score || 0),
    biometricMatchScore: parseFloat(data.biometric_match_score || 0),
    stolenIdentityMatch: data.stolen_identity_match,
    suspiciousPattern: data.suspicious_pattern,
    fraudRiskLevel: data.fraud_risk_level,
    status: data.status,
  };
}

// ─── EDUCATION ────────────────────────────────────────────────────────────────

export async function getApplicantByUserId(userId) {
  const { data } = await request('GET', `/education/applicant-by-user/${userId}`);
  return {
    id: data.id,
    userId: data.user_id,
    documentType: data.document_type,
    documentNumber: data.document_number,
    birthDate: data.birth_date,
    address: data.address,
    city: data.city,
    country: data.country,
    employmentStatus: data.employment_status,
    monthlyIncome: parseFloat(data.monthly_income || 0),
    profileStatus: data.profile_status,
  };
}

export async function getCourses() {
  const { data } = await request('GET', '/education/courses');
  return data.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    pointsReward: c.points_reward,
    scoreBonus: c.score_bonus,
    interestDiscount: parseFloat(c.interest_discount || 0),
    active: c.active,
  }));
}

export async function getCourseProgress(applicantId) {
  const { data } = await request('GET', `/education/progress/${applicantId}`);
  return data.map((p) => ({
    courseId: p.course_id,
    progressPercent: p.progress_percent,
    completed: p.completed,
    completedAt: p.completed_at,
  }));
}

export async function completeLesson(applicantId, courseId, progressPercent) {
  const { data } = await request('POST', '/education/update-progress', {
    applicant_id: applicantId,
    course_id: courseId,
    progress_percent: progressPercent,
  });
  return {
    courseId: data.progress.course_id,
    progressPercent: data.progress.progress_percent,
    completed: data.progress.completed,
    completedAt: data.progress.completed_at,
  };
}

// ─── AUDIT ───────────────────────────────────────────────────────────────────

export async function getAuditEvents() {
  const { data } = await request('GET', '/audit/recent-events?limit=20');
  return data.map((ev) => ({
    id: ev.id,
    aggregateType: ev.aggregate_type,
    eventType: ev.event_type,
    eventData: ev.event_data,
    hash: (ev.hash || '').substring(0, 12),
    previousHash: ev.previous_hash ? (ev.previous_hash).substring(0, 12) : null,
    createdAt: ev.created_at,
  }));
}

export async function getDecisionAudit() {
  const { data } = await request('GET', '/audit/recent-decision');
  return {
    applicationId: data.application_id,
    inputVariables: data.input_variables || {},
    modelWeights: data.model_weights || {},
    shapValues: data.shap_values || {},
    finalScore: data.final_score,
    finalDecision: data.final_decision,
    decisionReason: data.decision_reason,
    modelVersion: data.model_version,
    signedBySystem: data.signed_by_system,
    digitalSignature: (data.digital_signature || '').substring(0, 16),
    createdAt: data.created_at,
  };
}

export async function getRegulatoryReport() {
  const { data } = await request('GET', '/audit/regulator-report');
  const report = data.reports?.[0] || {};
  const computed = data.computed || {};
  return {
    reportPeriod: report.report_period || computed.period || '2026-06',
    regulatorName: report.regulator_name || 'Superintendencia de Bancos Demo',
    reportUrl: report.report_url || '#',
    generatedAt: report.generated_at || new Date().toISOString(),
    totalApplications: computed.totalApplications || 0,
    approved: computed.approved || 0,
    rejected: computed.rejected || 0,
    manualReview: computed.manualReview || 0,
    defaultRate: computed.defaultRate || 0,
    averageScore: computed.averageScore || 0,
  };
}
