import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { PawPrint, Calendar, HeartHandshake, Users, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export const Dashboard = () => {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{profile.name}</span>!</h1>
        <p className="text-gray-400 mt-1 text-sm">Here's what's happening with your pets today</p>
      </div>
      
      {profile.role === 'owner' && <OwnerDashboard />}
      {profile.role === 'vet' && <VetDashboard />}
      {profile.role === 'shelter' && <ShelterDashboard />}
      {profile.role === 'admin' && <AdminDashboard />}
    </div>
  );
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [pets, setPets] = React.useState<any[]>([]);
  const [appointments, setAppointments] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: p } = await supabase.from('pets').select('*').eq('owner_id', user.id);
      if (p) setPets(p);
      const { data: a } = await supabase.from('appointments').select('*').eq('owner_id', user.id);
      if (a) setAppointments(a);
    };
    fetchData();
  }, [user]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard i={0} title="My Pets" value={pets.length} icon={PawPrint} gradient="from-emerald-500 to-teal-500" />
      <DashboardCard i={1} title="Upcoming" value={appointments.filter(a => a.status === 'confirmed').length} icon={Calendar} gradient="from-blue-500 to-cyan-500" />
      <DashboardCard i={2} title="Pending" value={appointments.filter(a => a.status === 'pending').length} icon={Activity} gradient="from-amber-500 to-orange-500" />
    </div>
  );
};

const VetDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from('appointments').select('*').eq('vet_id', user.id);
      if (data) setAppointments(data);
    };
    fetchData();
  }, [user]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard i={0} title="Pending" value={appointments.filter(a => a.status === 'pending').length} icon={Calendar} gradient="from-amber-500 to-orange-500" />
      <DashboardCard i={1} title="Confirmed" value={appointments.filter(a => a.status === 'confirmed').length} icon={Activity} gradient="from-blue-500 to-cyan-500" />
    </div>
  );
};

const ShelterDashboard = () => {
  const { user } = useAuth();
  const [adoptions, setAdoptions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from('adoptions').select('*').eq('shelter_id', user.id);
      if (data) setAdoptions(data);
    };
    fetchData();
  }, [user]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard i={0} title="Available" value={adoptions.filter(a => a.status === 'available').length} icon={PawPrint} gradient="from-emerald-500 to-teal-500" />
      <DashboardCard i={1} title="Pending" value={adoptions.filter(a => a.status === 'pending').length} icon={HeartHandshake} gradient="from-purple-500 to-pink-500" />
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = React.useState({ users: 0, pets: 0, adoptions: 0, appointments: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      const [u, p, ad, ap] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('pets').select('id', { count: 'exact', head: true }),
        supabase.from('adoptions').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
      ]);
      setStats({ users: u.count ?? 0, pets: p.count ?? 0, adoptions: ad.count ?? 0, appointments: ap.count ?? 0 });
    };
    fetchStats();
  }, []);

  const data = [
    { name: 'Users', count: stats.users },
    { name: 'Pets', count: stats.pets },
    { name: 'Adoptions', count: stats.adoptions },
    { name: 'Appointments', count: stats.appointments },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard i={0} title="Users" value={stats.users} icon={Users} gradient="from-blue-500 to-cyan-500" />
        <DashboardCard i={1} title="Pets" value={stats.pets} icon={PawPrint} gradient="from-emerald-500 to-teal-500" />
        <DashboardCard i={2} title="Adoptions" value={stats.adoptions} icon={HeartHandshake} gradient="from-purple-500 to-pink-500" />
        <DashboardCard i={3} title="Appointments" value={stats.appointments} icon={Calendar} gradient="from-amber-500 to-orange-500" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Platform Overview</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} labelStyle={{ color: '#f3f4f6' }} itemStyle={{ color: '#34d399' }} />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

const DashboardCard = ({ i, title, value, icon: Icon, gradient }: { i: number, title: string, value: number, icon: any, gradient: string }) => (
  <motion.div custom={i} variants={cardVariants} initial="hidden" animate="visible" className="glass rounded-xl card-hover">
    <div className="p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  </motion.div>
);
