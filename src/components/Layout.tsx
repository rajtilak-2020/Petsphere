import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  PawPrint, 
  Calendar, 
  HeartHandshake, 
  Search, 
  MessageCircle, 
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  Pencil,
  Check
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UserSection = () => {
  const { profile, updateProfile } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(profile?.name || '');

  const handleSave = async () => {
    if (!name.trim() || name === profile?.name) { setEditing(false); return; }
    try {
      await updateProfile({ name: name.trim() });
      setEditing(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex items-center mb-4 px-2 gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
        {profile?.name?.charAt(0) || 'U'}
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              className="input-dark text-sm px-2 py-1 rounded w-full" />
            <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 p-0.5"><Check className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-gray-200 truncate">{profile?.name}</p>
            <button onClick={() => { setName(profile?.name || ''); setEditing(true); }} className="text-gray-500 hover:text-gray-300 transition-colors"><Pencil className="h-3 w-3" /></button>
          </div>
        )}
        <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
      </div>
    </div>
  );
};

export const Layout = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['owner', 'vet', 'shelter', 'admin'] },
    { name: 'My Pets', href: '/pets', icon: PawPrint, roles: ['owner'] },
    { name: 'Patients', href: '/pets', icon: PawPrint, roles: ['vet'] },
    { name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['owner', 'vet'] },
    { name: 'Adoptions', href: '/adoptions', icon: HeartHandshake, roles: ['owner', 'shelter', 'admin'] },
    { name: 'Lost & Found', href: '/lost-found', icon: Search, roles: ['owner', 'shelter', 'admin'] },
    { name: 'Community', href: '/community', icon: MessageCircle, roles: ['owner', 'vet', 'shelter', 'admin'] },
    { name: 'AI Advisor', href: '/ai-advisor', icon: Sparkles, roles: ['owner', 'vet', 'shelter', 'admin'] },
    { name: 'Emergency SOS', href: '/emergency', icon: AlertTriangle, roles: ['owner', 'admin'] },
    { name: 'Admin Panel', href: '/admin', icon: Shield, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter(item => profile?.role && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-gradient-main flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg glass text-gray-300 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 glass transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div className="flex items-center justify-center h-16 border-b border-white/[0.06] px-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center glow-brand-sm">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                PetSphere
              </span>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-3 space-y-1">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.href;
                const isEmergency = item.name === 'Emergency SOS';
                const isAI = item.name === 'AI Advisor';
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "glass-brand text-emerald-300 glow-brand-sm"
                        : isEmergency
                          ? "text-red-400/70 hover:text-red-300 hover:bg-red-500/10"
                          : isAI
                            ? "text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10"
                            : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                        isActive ? "text-emerald-400" : 
                          isEmergency ? "text-red-400/60 group-hover:text-red-300" :
                          isAI ? "text-purple-400/60 group-hover:text-purple-300" :
                          "text-gray-500 group-hover:text-gray-300"
                      )}
                    />
                    {item.name}
                    {isAI && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        AI
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User */}
          <div className="p-4 border-t border-white/[0.06]">
            <UserSection />
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-white/[0.04] hover:text-gray-200 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content with page transitions */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 lg:p-8 pt-16 lg:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
