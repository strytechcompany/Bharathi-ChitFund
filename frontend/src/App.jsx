import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './components/AuthLayout';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChitSchemes from './pages/ChitSchemes';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Completed from './pages/Completed';
import Settings from './pages/Settings';
import FPayment from './pages/FPayment';
import FPaymentCustomers from './pages/FPaymentCustomers';
import CreateFPaymentCustomer from './pages/CreateFPaymentCustomer';
import EditFPaymentCustomer from './pages/EditFPaymentCustomer';
import FPaymentCustomerDetails from './pages/FPaymentCustomerDetails';
import FPaymentPayments from './pages/FPaymentPayments';
import FPaymentCreate from './pages/FPaymentCreate';
import FPaymentEdit from './pages/FPaymentEdit';
import FPaymentDetails from './pages/FPaymentDetails';
import FPaymentTeams from './pages/FPaymentTeams';
import FPaymentTeamDetails from './pages/FPaymentTeamDetails';

const App = () => (
  <AuthProvider>
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected — all use MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chit-schemes" element={<ChitSchemes />} />
            <Route path="/chit-schemes/:schemeId/teams" element={<Teams />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamId" element={<TeamDetails />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/teams/:id" element={<TeamDetails />} />
            <Route path="/completed" element={<Completed />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/fpayment" element={<FPayment />} />
            <Route path="/fpayment/customers" element={<FPaymentCustomers />} />
            <Route path="/fpayment/customers/create" element={<CreateFPaymentCustomer />} />
            <Route path="/fpayment/customers/:id" element={<FPaymentCustomerDetails />} />
            <Route path="/fpayment/customers/:id/edit" element={<EditFPaymentCustomer />} />
            <Route path="/fpayment/payments" element={<FPaymentPayments />} />
            <Route path="/fpayment/payments/create" element={<FPaymentCreate />} />
            <Route path="/fpayment/payments/:id" element={<FPaymentDetails />} />
            <Route path="/fpayment/payments/:id/edit" element={<FPaymentEdit />} />
            <Route path="/fpayment/teams" element={<FPaymentTeams />} />
            <Route path="/fpayment/teams/:teamId" element={<FPaymentTeamDetails />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
