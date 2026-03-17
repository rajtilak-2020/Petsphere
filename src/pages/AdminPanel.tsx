import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Navigate } from 'react-router-dom';
import {
  Users, PawPrint, Calendar, HeartHandshake, MessageCircle, Search,
  TrendingUp, Shield, Trash2, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const TABS = ['Overview', 'Users', 'Posts', 'Appointments', 'Adoptions', 'Lost & Found'] as const;
type Tab = typeof TABS[number];

const COLORS = ['#34d399', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

export const AdminPanel = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('Overview');

  if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm">Platform analytics and management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Users' && <UsersTab />}
      {tab === 'Posts' && <PostsTab />}
      {tab === 'Appointments' && <AppointmentsTab />}
      {tab === 'Adoptions' && <AdoptionsTab />}
      {tab === 'Lost & Found' && <LostFoundTab />}
    </div>
  );
};

/* ============= OVERVIEW TAB ============= */
const OverviewTab = () => {
  const [stats, setStats] = useState({ users: 0, pets: 0, adoptions: 0, appointments: 0, posts: 0, lostFound: 0 });
  const [roleData, setRoleData] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [u, p, ad, ap, po, lf] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('pets').select('id', { count: 'exact', head: true }),
        supabase.from('adoptions').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('lost_found').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        users: u.count ?? 0, pets: p.count ?? 0, adoptions: ad.count ?? 0,
        appointments: ap.count ?? 0, posts: po.count ?? 0, lostFound: lf.count ?? 0,
      });

      const { data: users } = await supabase.from('users').select('role');
      if (users) {
        const counts: Record<string, number> = {};
        users.forEach((u: any) => { counts[u.role] = (counts[u.role] || 0) + 1; });
        setRoleData(Object.entries(counts).map(([name, value]) => ({ name, value })));
      }
    };
    fetch();
  }, []);

  const barData = [
    { name: 'Users', count: stats.users },
    { name: 'Pets', count: stats.pets },
    { name: 'Posts', count: stats.posts },
    { name: 'Appointments', count: stats.appointments },
    { name: 'Adoptions', count: stats.adoptions },
    { name: 'Lost/Found', count: stats.lostFound },
  ];

  const cards = [
    { title: 'Total Users', value: stats.users, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { title: 'Total Pets', value: stats.pets, icon: PawPrint, gradient: 'from-emerald-500 to-teal-500' },
    { title: 'Posts', value: stats.posts, icon: MessageCircle, gradient: 'from-purple-500 to-pink-500' },
    { title: 'Appointments', value: stats.appointments, icon: Calendar, gradient: 'from-amber-500 to-orange-500' },
    { title: 'Adoptions', value: stats.adoptions, icon: HeartHandshake, gradient: 'from-rose-500 to-red-500' },
    { title: 'Lost/Found', value: stats.lostFound, icon: Search, gradient: 'from-cyan-500 to-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3 shadow-lg`}>
              <c.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Platform Overview</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} labelStyle={{ color: '#f3f4f6' }} itemStyle={{ color: '#34d399' }} />
                <Bar dataKey="count" fill="url(#adminBarGrad)" radius={[6, 6, 0, 0]} />
                <defs><linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Users by Role</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                  {roleData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ============= USERS TAB ============= */
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { supabase.from('users').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setUsers(data); }); }, []);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Email</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
          </tr></thead>
          <tbody className="divide-y divide-white/[0.04]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0)}</div><span className="text-sm text-white font-medium">{u.name}</span></div></td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : u.role === 'vet' ? 'bg-blue-500/20 text-blue-300' : u.role === 'shelter' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{u.role}</span></td>
                <td className="px-5 py-3 text-sm text-gray-400">{u.email}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{format(new Date(u.created_at), 'PP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No users found.</div>}
    </div>
  );
};

/* ============= POSTS TAB ============= */
const PostsTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const fetchPosts = async () => { const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }); if (data) setPosts(data); };
  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    fetchPosts();
  };

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="glass rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{post.author_name}</span>
              <span className="text-xs text-gray-500">{format(new Date(post.created_at), 'PPp')}</span>
            </div>
            <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>❤️ {post.likes_count} likes</span>
            </div>
          </div>
          <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete post">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {posts.length === 0 && <div className="text-center py-12 glass rounded-xl text-gray-500 text-sm">No posts found.</div>}
    </div>
  );
};

/* ============= APPOINTMENTS TAB ============= */
const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  useEffect(() => { supabase.from('appointments').select('*').order('date', { ascending: false }).then(({ data }) => { if (data) setAppointments(data); }); }, []);

  const statusBadge = (s: string) => s === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : s === 'pending' ? 'bg-amber-500/20 text-amber-300' : s === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300';

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Reason</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-white/[0.04]">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-sm text-white">{a.reason}</td>
                <td className="px-5 py-3 text-sm text-gray-400">{format(new Date(a.date), 'PPp')}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(a.status)}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {appointments.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No appointments found.</div>}
    </div>
  );
};

/* ============= ADOPTIONS TAB ============= */
const AdoptionsTab = () => {
  const [adoptions, setAdoptions] = useState<any[]>([]);
  useEffect(() => { supabase.from('adoptions').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setAdoptions(data); }); }, []);

  const statusBadge = (s: string) => s === 'available' ? 'bg-emerald-500/20 text-emerald-300' : s === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300';

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Pet</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Breed</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Age</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-white/[0.04]">
            {adoptions.map((a) => (
              <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-sm text-white font-medium">{a.name}</td>
                <td className="px-5 py-3 text-sm text-gray-400">{a.breed}</td>
                <td className="px-5 py-3 text-sm text-gray-400">{a.age} yrs</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(a.status)}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adoptions.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No adoption listings found.</div>}
    </div>
  );
};

/* ============= LOST & FOUND TAB ============= */
const LostFoundTab = () => {
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => { supabase.from('lost_found').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setReports(data); }); }, []);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Type</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Pet Name</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Location</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-white/[0.04]">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${r.type === 'lost' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{r.type}</span></td>
                <td className="px-5 py-3 text-sm text-white">{r.pet_name || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-400">{r.location}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{format(new Date(r.date), 'PP')}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${r.status === 'active' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reports.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No reports found.</div>}
    </div>
  );
};
