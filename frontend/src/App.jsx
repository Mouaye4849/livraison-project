import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/registerPage";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>


        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />


        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="trajets" element={<TrajetsList />} />
          <Route path="trajets/create" element={<TrajetPage />} />
          <Route path="trajets/:id/edit" element={<EditTrajet />} />

          <Route path="colis/create" element={<CreateColis />} />
          <Route path="colis/public" element={<PublicColis />} />
          <Route path="my-colis" element={<MyColis />} />

          <Route path="assign" element={<AssignColis />} />
          <Route path="trajets/with-colis" element={<TrajetsWithColis />} />

          <Route path="payments" element={<MyPayments />} />
          <Route path="pay/:colisId" element={<Pay />} />
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
          <Route path="colis"   element={<AdminPanelColis />}   />
          <Route path="users"   element={<AdminPanelUsers />}   />
          <Route path="trajets" element={<AdminPanelTrajets />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;