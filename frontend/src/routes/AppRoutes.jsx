import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from '../components/ProtectedLayout/ProtectedLayout'
import Login from '../pages/Login/Login'
import Register from '../pages/Register/Register'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword'
import ResetPassword from '../pages/ResetPassword/ResetPassword'
import Dashboard from '../pages/Dashboard/Dashboard'
import Transactions from '../pages/Transactions/Transactions'
import AddTransaction from '../pages/Transactions/AddTransaction'
import EditTransaction from '../pages/Transactions/EditTransaction'
import TransactionDetails from '../pages/Transactions/TransactionDetails'
import Reports from '../pages/Reports/Reports'
import Recurring from '../pages/Recurring/Recurring'

import MonthlyReports from '../pages/Reports/MonthlyReports'
import SummaryReports from '../pages/Reports/SummaryReports'
import Profile from '../pages/Profile/Profile'
import NotFound from '../pages/NotFound/NotFound'
import AccountSecurity from '../pages/Settings/AccountSecurity'
import ReceiptScanner from '../pages/Receipts/ReceiptScanner'
import AiIntelligence from '../pages/AiIntelligence/AiIntelligence'

// Admin pages
import AdminRoute from './AdminRoute'
import AdminLayout from '../components/AdminLayout/AdminLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import UserManagement from '../pages/Admin/UserManagement'
import UserDetail from '../pages/Admin/UserDetail'
import PlatformAnalytics from '../pages/Admin/PlatformAnalytics'
import SecurityMonitoring from '../pages/Admin/SecurityMonitoring'
import AuditLogViewer from '../pages/Admin/AuditLogViewer'
import SystemHealth from '../pages/Admin/SystemHealth'
import AdminSettings from '../pages/Admin/AdminSettings'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/add" element={<AddTransaction />} />
          <Route path="/transactions/edit/:id" element={<EditTransaction />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/monthly" element={<MonthlyReports />} />
          <Route path="/reports/summary" element={<SummaryReports />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/account-security" element={<AccountSecurity />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/receipts" element={<ReceiptScanner />} />
          <Route path="/intelligence" element={<AiIntelligence />} />

          <Route path="/transactions/view/:id" element={<TransactionDetails />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/users/:id" element={<UserDetail />} />
            <Route path="/admin/analytics" element={<PlatformAnalytics />} />
            <Route path="/admin/security" element={<SecurityMonitoring />} />
            <Route path="/admin/audit-logs" element={<AuditLogViewer />} />
            <Route path="/admin/health" element={<SystemHealth />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
