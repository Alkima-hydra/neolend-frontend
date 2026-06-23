import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage    from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

import ProfilePage            from "./pages/Applicant/ProfilePage";
import UploadDocumentPage     from "./pages/Applicant/UploadDocumentPage";
import ApplyPage              from "./pages/Applicant/ApplyPage";
import ApplicationStatusPage  from "./pages/Applicant/ApplicationStatusPage";
import ExternalDataSummaryPage from "./pages/Applicant/ExternalDataSummaryPage";
import ResultPage             from "./pages/Applicant/ResultPage";
import DisbursementPage       from "./pages/Applicant/DisbursementPage";
import LoanStatusPage         from "./pages/Applicant/LoanStatusPage";
import EducationPage          from "./pages/Applicant/EducationPage";

import ReviewPage             from "./pages/Analyst/ReviewPage";
import ScoringExplanationPage from "./pages/Analyst/ScoringExplanationPage";

import CollectionsDashboard   from "./pages/Collections/CollectionsDashboard";
import PaymentAgreementsPage  from "./pages/Collections/PaymentAgreementsPage";

import InvestorDashboard from "./pages/Investor/InvestorDashboard";

import FraudPage from "./pages/Fraud/FraudPage";

import AuditPage from "./pages/Regulator/AuditPage";
import UsersPage from "./pages/Admin/UsersPage";

function UnauthorizedPage() {
  return (
    <Layout>
      <div style={{ textAlign: "center", padding: "4rem", color: "#f87171" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
        <h2 style={{ color: "#f1f5f9" }}>Acceso no autorizado</h2>
        <p style={{ color: "#64748b" }}>No tienes permisos para acceder a esta sección.</p>
      </div>
    </Layout>
  );
}

function WithLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Solicitante */}
          <Route path="/applicant/profile" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE","COMERCIO"]}>
              <WithLayout><ProfilePage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/upload-document" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE","COMERCIO"]}>
              <WithLayout><UploadDocumentPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/apply" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><ApplyPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/application-status" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><ApplicationStatusPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/external-data-summary" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><ExternalDataSummaryPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/result" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><ResultPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/disbursement" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><DisbursementPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/loan-status" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><LoanStatusPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/applicant/education" element={
            <ProtectedRoute allowedRoles={["SOLICITANTE"]}>
              <WithLayout><EducationPage /></WithLayout>
            </ProtectedRoute>
          } />

          {/* Analista */}
          <Route path="/analyst/review" element={
            <ProtectedRoute allowedRoles={["ANALISTA"]}>
              <WithLayout><ReviewPage /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/analyst/scoring-explanation" element={
            <ProtectedRoute allowedRoles={["ANALISTA"]}>
              <WithLayout><ScoringExplanationPage /></WithLayout>
            </ProtectedRoute>
          } />

          {/* Cobranza */}
          <Route path="/collections/dashboard" element={
            <ProtectedRoute allowedRoles={["GESTOR_COBRANZA"]}>
              <WithLayout><CollectionsDashboard /></WithLayout>
            </ProtectedRoute>
          } />
          <Route path="/collections/payment-agreements" element={
            <ProtectedRoute allowedRoles={["GESTOR_COBRANZA"]}>
              <WithLayout><PaymentAgreementsPage /></WithLayout>
            </ProtectedRoute>
          } />

          {/* Inversionista */}
          <Route path="/investor/dashboard" element={
            <ProtectedRoute allowedRoles={["INVERSIONISTA"]}>
              <WithLayout><InvestorDashboard /></WithLayout>
            </ProtectedRoute>
          } />

          {/* Fraude — accesible para Regulador y Analista */}
          <Route path="/fraud" element={
            <ProtectedRoute allowedRoles={["REGULADOR","ANALISTA"]}>
              <WithLayout><FraudPage /></WithLayout>
            </ProtectedRoute>
          } />

          {/* Auditoría */}
          <Route path="/regulator/audit" element={
            <ProtectedRoute allowedRoles={["REGULADOR"]}>
              <WithLayout><AuditPage /></WithLayout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <WithLayout><UsersPage /></WithLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
