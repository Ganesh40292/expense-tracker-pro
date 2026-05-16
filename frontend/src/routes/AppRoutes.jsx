import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from '../components/ProtectedLayout/ProtectedLayout'
import Login from '../pages/Login/Login'
import Register from '../pages/Register/Register'
import Dashboard from '../pages/Dashboard/Dashboard'
import Transactions from '../pages/Transactions/Transactions'
import AddTransaction from '../pages/Transactions/AddTransaction'
import EditTransaction from '../pages/Transactions/EditTransaction'
import TransactionDetails from '../pages/Transactions/TransactionDetails'
import Reports from '../pages/Reports/Reports'

import MonthlyReports from '../pages/Reports/MonthlyReports'
import SummaryReports from '../pages/Reports/SummaryReports'
import Profile from '../pages/Profile/Profile'
import NotFound from '../pages/NotFound/NotFound'
import AccountSecurity from '../pages/Settings/AccountSecurity'


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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

          <Route path="/transactions/view/:id" element={<TransactionDetails />} />

        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
