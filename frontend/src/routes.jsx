import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedClientRoute from "./user/client/components/ProtectedClientRoute";
import ClientLayout from "./user/client/layout/ClientLayout";


/* -------- Admin Pages -------- */
import Login from "./admin/pages/Login";
import Dashboard from "./admin/pages/Dashboard";
import Policies from "./admin/pages/Policies";
import AddPolicy from "./admin/pages/AddPolicy";
import EditPolicy from "./admin/pages/EditPolicy";
import Agents from "./admin/pages/Agents";
import AddAgent from "./admin/pages/AddAgent";
import EditAgent from "./admin/pages/EditAgent";
import Inquiries from "./admin/pages/Inquiries";
import BuyRequests from "./admin/pages/BuyRequests";
import AdminKyc from "./admin/pages/AdminKyc";
import Profile from "./admin/pages/Profile";
import Companies from "./admin/pages/Companies";
import AddCompany from "./admin/pages/AddCompany";
import EditCompany from "./admin/pages/EditCompany";
import Clients from "./admin/pages/Clients";
import AddClient from "./admin/pages/AddClient";
import EditClient from "./admin/pages/EditClient";

import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";

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

/* -------- Client Pages -------- */
import ClientDashboard from "./user/client/pages/Dashboard";
import ClientPolicies from "./user/client/pages/AllPolicies";
import ClientSaved from "./user/client/pages/SavedPolicies";
import ClientCompare from "./user/client/pages/CompareClient";
import ClientAgent from "./user/client/pages/AgentDetails";
import ClientBuy from "./user/client/pages/BuyRequest";
import ClientProfile from "./user/client/pages/ClientProfile";
import KycPage from "./user/client/pages/KycPage";
import PaymentPage from "./user/client/pages/Payment";
import PaymentSuccess from "./user/client/pages/PaymentSuccess";
import PaymentFailure from "./user/client/pages/PaymentFailure";
import PaymentHistory from "./user/client/pages/PaymentHistory";
import MyProfile from "./user/client/pages/MyProfile";
import ResetPassword from "./auth/ResetPassword";
import Notifications from "./user/client/pages/Notifications";
import MyBuyRequests from "./user/client/pages/MyBuyRequests";
import MyPolicies from "./user/client/pages/MyPolicies";
import Dashboard from "./admin/dashboard/Dashboard";

<Route path="/admin" element={<AdminLayout />}>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="policies" element={<div>Policies</div>} />
  <Route path="renewals" element={<div>Renewals</div>} />
  <Route path="payments" element={<div>Payments</div>} />
  <Route path="users" element={<div>Users</div>} />
  <Route path="settings" element={<div>Settings</div>} />
</Route>


import RenewalList from "./admin/renewals/RenewalList";

<Route path="/admin" element={<AdminLayout />}>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="renewals" element={<RenewalList />} />
</Route>

import PaymentList from "./admin/payments/PaymentList";

<Route path="/admin" element={<AdminLayout />}>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="renewals" element={<RenewalList />} />
  <Route path="payments" element={<PaymentList />} />
</Route>



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
  path="/client/buy-requests"
  element={
    <ProtectedClientRoute>
      <ClientLayout>
        <MyBuyRequests />
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



      {/* ----- ADMIN ROUTES (UNCHANGED) ----- */}
      <Route path="/admin/login" element={<Login />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <Dashboard />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/policies"
        element={
          <ProtectedAdminRoute>
            <Policies />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/policies/add"
        element={
          <ProtectedAdminRoute>
            <AddPolicy />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/policies/edit/:id"
        element={
          <ProtectedAdminRoute>
            <EditPolicy />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/agents"
        element={
          <ProtectedAdminRoute>
            <Agents />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/agents/add"
        element={
          <ProtectedAdminRoute>
            <AddAgent />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/agents/edit/:id"
        element={
          <ProtectedAdminRoute>
            <EditAgent />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/inquiries"
        element={
          <ProtectedAdminRoute>
            <Inquiries />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/buy-requests"
        element={
          <ProtectedAdminRoute>
            <BuyRequests />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/kyc"
        element={
          <ProtectedAdminRoute>
            <AdminKyc />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <ProtectedAdminRoute>
            <Profile />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/companies"
        element={
          <ProtectedAdminRoute>
            <Companies />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/companies/add"
        element={
          <ProtectedAdminRoute>
            <AddCompany />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/companies/edit/:id"
        element={
          <ProtectedAdminRoute>
            <EditCompany />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/clients"
        element={
          <ProtectedAdminRoute>
            <Clients />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/clients/add"
        element={
          <ProtectedAdminRoute>
            <AddClient />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/clients/edit/:id"
        element={
          <ProtectedAdminRoute>
            <EditClient />
          </ProtectedAdminRoute>
        }
      />

    </Routes>

    
  );
};

export default AppRoutes;
