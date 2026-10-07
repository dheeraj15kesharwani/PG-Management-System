import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard/Dashboard";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import PGSetup from "./pages/PGSetup/PGSetup";
import Tenants from "./pages/Tenants/Tenants";
import TenantDetails from "./pages/TenantDetails/TenantDetails";
import Rooms from "./pages/Rooms/Rooms";
import Payments from "./pages/Payments/Payments";
import Users from "./pages/Users/Users";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pg-setup" element={<PGSetup />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/tenants"
              element={<Tenants />}
            />

            <Route
              path="/tenants/:tenantId"
              element={<TenantDetails />}
            />

            <Route
              path="/rooms"
              element={<Rooms />}
            />

            <Route
              path="/payments"
              element={<Payments />}
            />

            <Route 
              path="/Users" 
              element={<Users />} 
            />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;