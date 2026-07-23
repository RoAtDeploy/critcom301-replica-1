import React from 'react';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const UserDisabledNotice = () => {
  const { logout } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100">
            <ShieldOff className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Disabled</h1>
          <p className="text-slate-600 mb-8">
            Your access to this application has been disabled by an administrator. Please contact the app administrator if you believe this is an error.
          </p>
          <button
            onClick={() => logout(true)}
            className="px-5 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDisabledNotice;