import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Calendar, Plus, X, Check } from 'lucide-react';
import { format } from 'date-fns';

export const Appointments = () => {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAppt, setNewAppt] = useState({ petId: '', vetId: '', date: '', reason: '' });
  const [vets, setVets] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);

  const fetchAppointments = async () => {
    if (!user || !profile) return;
    let q = supabase.from('appointments').select('*');
    if (profile.role === 'owner') q = q.eq('owner_id', user.id);
    else if (profile.role === 'vet') q = q.eq('vet_id', user.id);
    const { data } = await q;
    if (data) setAppointments(data);
  };

  useEffect(() => {
    fetchAppointments();
    const ch = supabase.channel('appts-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, profile]);

  useEffect(() => {
    if (isAdding && profile?.role === 'owner') {
      (async () => {
        const { data: v } = await supabase.from('users').select('*').eq('role', 'vet');
        setVets(v ?? []);
        const { data: p } = await supabase.from('pets').select('*').eq('owner_id', user?.id);
        setPets(p ?? []);
      })();
    }
  }, [isAdding, profile, user]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('appointments').insert({ pet_id: newAppt.petId, vet_id: newAppt.vetId, date: newAppt.date, reason: newAppt.reason, owner_id: user.id, status: 'pending' });
    if (!error) { setIsAdding(false); setNewAppt({ petId: '', vetId: '', date: '', reason: '' }); fetchAppointments(); }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (!error) fetchAppointments();
  };

  const statusBadge = (s: string) => s === 'confirmed' ? 'badge-success' : s === 'pending' ? 'badge-warning' : s === 'cancelled' ? 'badge-danger' : 'badge-neutral';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-gray-400 text-sm mt-1">{appointments.length} total appointments</p>
        </div>
        {profile?.role === 'owner' && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/20 transition-shadow">
            <Plus className="-ml-1 mr-2 h-4 w-4" /> Book Appointment
          </motion.button>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Book Appointment</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Pet</label>
                <select required value={newAppt.petId} onChange={e => setNewAppt({...newAppt, petId: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm">
                  <option value="">Select a pet</option>{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Veterinarian</label>
                <select required value={newAppt.vetId} onChange={e => setNewAppt({...newAppt, vetId: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm">
                  <option value="">Select a vet</option>{vets.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Date & Time</label>
                <input type="datetime-local" required value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Reason</label>
                <textarea required value={newAppt.reason} onChange={e => setNewAppt({...newAppt, reason: e.target.value})} rows={3} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/20 transition-shadow">Book</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <div className="divide-y divide-white/[0.05]">
          {appointments.map((appt, i) => (
            <motion.div key={appt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{appt.reason}</p>
                  <p className="text-xs text-gray-500">{format(new Date(appt.date), 'PPpp')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                {profile?.role === 'vet' && appt.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleStatusUpdate(appt.id, 'confirmed')} className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Accept">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleStatusUpdate(appt.id, 'cancelled')} className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Reject">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusBadge(appt.status)}`}>{appt.status}</span>
              </div>
            </motion.div>
          ))}
          {appointments.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-gray-600" />
              <p className="mt-2 text-sm text-gray-400">No appointments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
