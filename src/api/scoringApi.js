// Cliente del microservicio neolend-credit-scoring-service (scoring + aprobación
// automática/manual + auditoría regulatoria). Sin autenticación: el servicio no
// depende de tokens, así que estas funciones llaman directo a su REST API.
//
// Todas las respuestas del backend tienen forma { success, data } o
// { success: false, error: { message } }; este módulo las desenvuelve y lanza
// un Error con el mensaje cuando success es false, para que las páginas solo
// necesiten un try/catch.

const BASE_URL = import.meta.env.VITE_SCORING_API_URL || "http://localhost:3001/api";

async function request(path, { method = "GET", body, query } = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      "No se pudo contactar al servicio de scoring (¿está corriendo en " + BASE_URL + "?)"
    );
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Respuesta inválida del servicio de scoring (HTTP ${res.status})`);
  }

  if (!json.success) {
    throw new Error(json.error?.message || `Error del servicio de scoring (HTTP ${res.status})`);
  }
  return json.data;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

export function evaluateScoring(applicationId, applicantId, requestedAmount) {
  return request("/scoring/evaluate", {
    method: "POST",
    body: { applicationId, applicantId, requestedAmount },
  });
}

export function getScoringResult(applicationId) {
  return request(`/scoring/result/${applicationId}`);
}

export function getScoringExplanation(applicationId) {
  return request(`/scoring/explanation/${applicationId}`);
}

export function getCurrentModel() {
  return request("/scoring/model/current");
}

export function switchModel(targetModel) {
  return request("/scoring/model/switch", { method: "POST", body: { targetModel } });
}

export function getCircuitBreakerStatus() {
  return request("/scoring/circuit-breaker/status");
}

// ─── Aprobación ───────────────────────────────────────────────────────────────

export function runAutomaticApproval(applicationId, requestedAmount) {
  return request("/approval/automatic", {
    method: "POST",
    body: requestedAmount ? { applicationId, requestedAmount } : { applicationId },
  });
}

export function submitManualReview(applicationId, analystId, decision, reason) {
  return request("/approval/manual-review", {
    method: "POST",
    body: { applicationId, analystId, decision, reason },
  });
}

export function getApprovalDecision(applicationId) {
  return request(`/approval/decision/${applicationId}`);
}

export function submitAnalystDecision(applicationId, analystId, decision, reason) {
  return request(`/approval/${applicationId}/analyst-decision`, {
    method: "PATCH",
    body: { analystId, decision, reason },
  });
}

// ─── Soporte / integración (lectura) ──────────────────────────────────────────
// Lee directo de las tablas Neon compartidas: permite que el frontend funcione
// con datos reales aunque applicant-service / credit-application-service no
// estén desplegados todavía.

export function listApplications({ status, applicantId, limit } = {}) {
  return request("/support/applications", { query: { status, applicantId, limit } });
}

export function getApplicationDetail(applicationId) {
  return request(`/support/applications/${applicationId}`);
}

export function listApplicants({ userId, limit } = {}) {
  return request("/support/applicants", { query: { userId, limit } });
}

export function getAuditTrail(applicationId) {
  return request(`/support/audit/${applicationId}`);
}

// ─── Health ───────────────────────────────────────────────────────────────────

export function checkHealth() {
  return fetch(`${BASE_URL.replace(/\/api$/, "")}/health`).then((r) => r.json());
}
