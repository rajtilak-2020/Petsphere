import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Stethoscope, Home } from 'lucide-react';

export const RoleSelection = () => {
  const { user, profile, setRole, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-hero">
      <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/" replace />;

  const [error, setError] = React.useState('');
  const [selecting, setSelecting] = React.useState(false);

  const handleSelectRole = async (role: UserRole) => {
    setError('');
    setSelecting(true);
    try {
      await setRole(role);
      navigate('/');
    } catch (err: any) {
      console.error('Role selection error:', err);
      setError(err.message || 'Failed to set role. Please try again.');
      setSelecting(false);
    }
  };

  const roles = [
    { id: 'owner', name: 'Pet Owner', icon: User, description: 'Manage your pets, book appointments, and connect with the community.', color: 'from-emerald-500 to-teal-500', glow: 'hover:shadow-emerald-500/20' },
    { id: 'vet', name: 'Veterinarian', icon: Stethoscope, description: 'Manage appointments, view patient records, and provide care.', color: 'from-blue-500 to-cyan-500', glow: 'hover:shadow-blue-500/20' },
    { id: 'shelter', name: 'Animal Shelter', icon: Home, description: 'List pets for adoption and manage adoption requests.', color: 'from-purple-500 to-pink-500', glow: 'hover:shadow-purple-500/20' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10"
      >
        <h2 className="text-center text-3xl font-extrabold text-white">
          Welcome to PetSphere!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Choose how you'll use the platform
        </p>
      </motion.div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectRole(role.id as UserRole)}
              className={`glass rounded-xl px-6 py-6 text-left group card-hover hover:shadow-lg ${role.glow} transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <role.icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">{role.name}</p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{role.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
