import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { RoleSelection } from './pages/RoleSelection';
import { Dashboard } from './pages/Dashboard';
import { Pets } from './pages/Pets';
import { Appointments } from './pages/Appointments';
import { Adoptions } from './pages/Adoptions';
import { LostFound } from './pages/LostFound';
import { Community } from './pages/Community';
import { Emergency } from './pages/Emergency';
import { AiAdvisor } from './pages/AiAdvisor';
import { AdminPanel } from './pages/AdminPanel';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-hero">
      <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!profile) return <Navigate to="/role-selection" replace />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pets" element={<Pets />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="adoptions" element={<Adoptions />} />
            <Route path="lost-found" element={<LostFound />} />
            <Route path="community" element={<Community />} />
            <Route path="emergency" element={<Emergency />} />
            <Route path="ai-advisor" element={<AiAdvisor />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
