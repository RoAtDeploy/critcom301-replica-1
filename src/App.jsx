import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import StaffMembers from '@/pages/StaffMembers';
import AddStaff from '@/pages/AddStaff';
import GenerateReport from '@/pages/GenerateReport.jsx';
import ActionItems from '@/pages/ActionItems';
import Admin from '@/pages/Admin';
import StaffDetail from '@/pages/StaffDetail';
import ReportDetail from '@/pages/ReportDetail';
import { AdminProvider } from '@/context/AdminContext';
import MonitoringOnMass from '@/pages/MonitoringOnMass';
import StaffReview from '@/pages/StaffReview';
import UserGuide from '@/pages/UserGuide';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/staff" element={<StaffMembers />} />
        <Route path="/staff/new" element={<AddStaff />} />
        <Route path="/staff/:id" element={<StaffDetail />} />
        <Route path="/reports/new" element={<GenerateReport />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/actions" element={<ActionItems />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/monitoring" element={<MonitoringOnMass />} />
        <Route path="/user-guide" element={<UserGuide />} />
      </Route>
      <Route path="/staff-review/:id" element={<StaffReview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AdminProvider>
    </AuthProvider>
  )
}

export default App