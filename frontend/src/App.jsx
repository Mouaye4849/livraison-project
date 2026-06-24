import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/registerPage";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import VoyageurRoute from "./components/VoyageurRoute";
import UserRoute from "./components/UserRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TrajetPage from "./pages/TrajetPage";
import TrajetsList from "./pages/TrajetsList";
import EditTrajet from "./pages/EditTrajet";
import CreateColis from "./pages/CreateColis";
import AssignColis from "./pages/AssignColis";
import TrajetsWithColis from "./pages/TrajetsWithColis";
import PublicColis from "./pages/PublicColis";
import MyColis from "./pages/MyColis";
import MyPayments from "./pages/MyPayments";
import Pay from "./pages/Pay";
import ChatPage from "./pages/ChatPage";
import MessagesPage from "./pages/MessagesPage";
import TrackingPage from "./pages/TrackingPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";

// 🛡 ADMIN (desktop)
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminColis from "./pages/AdminColis";
import AdminTrajets from "./pages/AdminTrajets";
import AdminUsers from "./pages/AdminUsers";
import AdminPendingTrajets from "./pages/AdminPendingTrajets";

// 📱 ADMIN MOBILE WEB PANEL
import AdminPanelRoute from "./admin-panel/AdminPanelRoute";
import AdminPanelLayout from "./admin-panel/AdminPanelLayout";
import AdminPanelLogin from "./admin-panel/pages/AdminPanelLogin";
import AdminPanelHome from "./admin-panel/pages/AdminPanelHome";
import AdminPanelColis from "./admin-panel/pages/AdminPanelColis";
import AdminPanelUsers from "./admin-panel/pages/AdminPanelUsers";
import AdminPanelTrajets from "./admin-panel/pages/AdminPanelTrajets";
import { User } from "lucide-react";

function App() {
  return (
    <BrowserRouter>
      <Routes>


        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />


        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="trajets" element={<VoyageurRoute><TrajetsList /></VoyageurRoute>} />
          <Route path="trajets/create" element={<VoyageurRoute><TrajetPage /></VoyageurRoute>} />
          <Route path="trajets/:id/edit" element={<VoyageurRoute><EditTrajet /></VoyageurRoute>} />

          <Route path="colis/create" element={<UserRoute><CreateColis /></UserRoute>} />
          <Route path="colis/public" element={<VoyageurRoute><PublicColis /></VoyageurRoute>} />
          <Route path="my-colis" element={<UserRoute><MyColis /></UserRoute>} />

          <Route path="assign" element={<VoyageurRoute><AssignColis /></VoyageurRoute>} />
          <Route path="trajets/with-colis" element={<VoyageurRoute><TrajetsWithColis /></VoyageurRoute>} />

          <Route path="payments" element={<MyPayments />} />
          <Route path="pay/:colisId" element={<UserRoute><Pay /></UserRoute>} />
          <Route path="chat/:colisId" element={<ChatPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="tracking/:colisId" element={<TrackingPage />} />
        </Route>

        {/* =============================
            🛡 ADMIN DASHBOARD (🔥 FIXED)
        ============================= */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* default */}
          <Route index element={<AdminDashboard />} />

          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="colis" element={<AdminColis />} />

          <Route path="trajets" element={<AdminTrajets />} />

          {/* 🔥 VALIDATION PAGE */}
          <Route path="trajets/pending" element={<AdminPendingTrajets />} />

          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* ================================
            📱 ADMIN MOBILE WEB PANEL
        ================================ */}
        <Route path="/m-admin/login" element={<AdminPanelLogin />} />
        <Route
          path="/m-admin"
          element={
            <AdminPanelRoute>
              <AdminPanelLayout />
            </AdminPanelRoute>
          }
        >
          <Route index element={<AdminPanelHome />} />
          <Route path="colis" element={<AdminPanelColis />} />
          <Route path="users" element={<AdminPanelUsers />} />
          <Route path="trajets" element={<AdminPanelTrajets />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;