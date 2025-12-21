import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedClientRoute from "./user/client/components/ProtectedClientRoute";
import ClientLayout from "./user/client/layout/ClientLayout";

/* -------- Admin Pages -------- */
import Login from "./admin/pages/Login";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboard from "./admin/dashboard/Dashboard";
import PolicyList from "./admin/policies/PolicyList";
import PolicyForm from "./admin/policies/PolicyForm";
import AgentList from "./admin/agents/AgentList";
import AgentForm from "./admin/agents/AgentForm";
import CompanyList from "./admin/companies/CompanyList";
import CompanyForm from "./admin/companies/CompanyForm";
import RenewalList from "./admin/renewals/RenewalList";
import PaymentList from "./admin/payments/PaymentList";
import UserList from "./admin/users/UserList";
import NotificationCenter from "./admin/notifications/NotificationCenter";
import Reports from "./admin/reports/Reports";
import AuditLog from "./admin/audit/AuditLog";
import Settings from "./admin/settings/Settings";
import SupportList from "./admin/support/SupportList";
import SupportView from "./admin/support/SupportView";
import AgentInquiryList from "./admin/agent-inquiries/AgentInquiryList";

/* -------- Guest Pages -------- */
import Home from "./user/guest/pages/Home";
import GuestPolicies from "./user/guest/pages/Policies";
import GuestPolicyDetails from "./user/guest/pages/PolicyDetails";
import AboutUs from "./About";
import ContactUs from "./ContactUs";
import FAQ from "./FAQ";

/* -------- Auth Pages -------- */
import UserLogin from "./auth/Login";
import UserRegister from "./auth/Register";
import ResetPassword from "./auth/ResetPassword";

/* -------- Client Pages -------- */
import ClientDashboard from "./user/client/pages/Dashboard";
import ClientPolicies from "./user/client/pages/AllPolicies";
import ClientSaved from "./user/client/pages/SavedPolicies";
import ClientCompare from "./user/client/pages/CompareClient";
import ClientAgent from "./user/client/pages/AgentDetails";
import ClientBuy from "./user/client/pages/BuyRequest";
import KycPage from "./user/client/pages/KycPage";
import PaymentPage from "./user/client/pages/Payment";
import PaymentSuccess from "./user/client/pages/PaymentSuccess";
import PaymentFailure from "./user/client/pages/PaymentFailure";
import PaymentHistory from "./user/client/pages/PaymentHistory";
import MyProfile from "./user/client/pages/MyProfile";
import Notifications from "./user/client/pages/Notifications";
import MyPolicies from "./user/client/pages/MyPolicies";
import MyTickets from "./user/client/pages/MyTickets";
import NewTicket from "./user/client/pages/NewTicket";
import SupportChat from "./user/client/pages/SupportChat";




const AppRoutes = () => {
  return (
    <Routes>
      {/* ----- GUEST ROUTES ----- */}
      <Route path="/" element={<Home />} />
      <Route path="/policies" element={<GuestPolicies />} />
      <Route path="/policy/:id" element={<GuestPolicyDetails />} />
      <Route
        path="/compare"
        element={<Navigate to="/login?redirect=%2Fclient%2Fpolicies" replace />}
      />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/faq" element={<FAQ />} />

      {/* ----- USER AUTH ----- */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ----- CLIENT ROUTES ----- */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <ClientDashboard />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/profile"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <MyProfile />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/support"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <MyTickets />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/support/new"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <NewTicket />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/support/:id"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <SupportChat />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />

      <Route
        path="/client/my-profile"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <MyProfile />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/notifications"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <Notifications />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/payment"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <PaymentPage />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/payment-success"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <PaymentSuccess />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/payment-failure"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <PaymentFailure />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/policies"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <ClientPolicies />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/saved"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <ClientSaved />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/my-policies"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <MyPolicies />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/compare"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <ClientCompare />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/agent"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <ClientAgent />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/kyc"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <KycPage />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/buy"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <ClientBuy />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />
      <Route
        path="/client/payments"
        element={
          <ProtectedClientRoute>
            <ClientLayout>
              <PaymentHistory />
            </ClientLayout>
          </ProtectedClientRoute>
        }
      />

      {/* ----- ADMIN ROUTES ----- */}
      <Route path="/admin/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="policies" element={<PolicyList />} />
        <Route path="policies/create" element={<PolicyForm />} />
        <Route path="policies/:id/edit" element={<PolicyForm />} />
        <Route path="agents" element={<AgentList />} />
        <Route path="agents/create" element={<AgentForm />} />
        <Route path="agents/:id/edit" element={<AgentForm />} />
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/create" element={<CompanyForm />} />
        <Route path="companies/:id/edit" element={<CompanyForm />} />
        <Route path="renewals" element={<RenewalList />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="users" element={<UserList />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="settings" element={<Settings />} />
        <Route path="support" element={<SupportList />} />
        <Route path="support/:id" element={<SupportView />} />
        <Route path="agent-inquiries" element={<AgentInquiryList />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
