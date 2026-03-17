import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadFile } from '../supabase';
import { motion } from 'motion/react';
import { Search, Plus, X, MapPin, Calendar, ImagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { ImageCropper } from '../components/ImageCropper';

export const LostFound = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newReport, setNewReport] = useState({ type: 'lost', petName: '', description: '', location: '', date: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [foundingPet, setFoundingPet] = useState<any | null>(null);
  const [foundMessage, setFoundMessage] = useState('');

  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchReports = async () => { const { data } = await supabase.from('lost_found').select('*').order('created_at', { ascending: false }); if (data) setReports(data); };

  useEffect(() => {
    fetchReports();
    const ch = supabase.channel('lf-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'lost_found' }, () => fetchReports()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadFile('lost-found', photoFile);
      const { error } = await supabase.from('lost_found').insert({ type: 'lost', pet_name: newReport.petName, description: newReport.description, location: newReport.location, date: newReport.date, reporter_id: user.id, status: 'active', photo_url });
      if (!error) { setIsAdding(false); resetForm(); fetchReports(); }
    } finally { setUploading(false); }
  };

  const handleFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !foundingPet) return;
    setUploading(true);
    try {
      const updateMsg = `\n\n--- FOUND UPDATE ---\n${foundMessage}`;
      const { error } = await supabase.from('lost_found').update({ 
        status: 'resolved',
        description: foundingPet.description + updateMsg
      }).eq('id', foundingPet.id);
      
      if (error) {
        alert("Failed to mark as found: " + error.message);
      } else {
        setFoundingPet(null);
        setFoundMessage('');
        fetchReports();
      }
    } finally { setUploading(false); }
  };

  const resetForm = () => {
    setNewReport({ type: 'lost', petName: '', description: '', location: '', date: '' });
    setPhotoFile(null);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setRawFile(f);
    e.target.value = '';
  };

  const getFinderMessage = (description: string) => {
    if (!description) return '';
    const parts = description.split('--- FOUND UPDATE ---');
    return parts.length > 1 ? parts[1].trim() : description;
  };
  
  const getOriginalDescription = (description: string) => {
    if (!description) return '';
    const parts = description.split('--- FOUND UPDATE ---');
    return parts[0].trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Lost & Found</h1>
          <p className="text-gray-400 text-sm mt-1">{reports.filter(r => r.type === 'lost').length} lost pets reported</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/20 transition-shadow">
          <Plus className="-ml-1 mr-2 h-4 w-4" /> Report Pet
        </motion.button>
      </div>

      {rawFile && <ImageCropper file={rawFile} onCrop={(f) => { setPhotoFile(f); setRawFile(null); }} onCancel={() => setRawFile(null)} />}

      {/* Found Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Found Details</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            {selectedReport.photo_url && (
              <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-white/10">
                <img src={selectedReport.photo_url} alt="Found pet" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Finder's Message</h3>
                <p className="text-sm text-gray-200 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  {getFinderMessage(selectedReport.description)}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Original Report</h3>
                <p className="text-sm text-gray-400">{getOriginalDescription(selectedReport.description)}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-500 flex flex-col">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Lost near: {selectedReport.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date: {format(new Date(selectedReport.date), 'PP')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Report Lost or Found Pet</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Photo</label>
                <label className="flex items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-dashed border-white/10 hover:border-amber-500/30 cursor-pointer transition-colors overflow-hidden">
                  {photoFile ? (
                    <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center text-gray-500"><ImagePlus className="h-6 w-6 mx-auto mb-1" /><span className="text-xs">Click to upload</span></div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
                </label>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Pet Name</label>
                <input type="text" value={newReport.petName} onChange={e => setNewReport({...newReport, petName: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea required value={newReport.description} onChange={e => setNewReport({...newReport, description: e.target.value})} rows={3} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
                <input type="text" required value={newReport.location} onChange={e => setNewReport({...newReport, location: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
                <input type="date" required value={newReport.date} onChange={e => setNewReport({...newReport, date: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/20 transition-shadow disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {foundingPet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">I Found This Pet</h2>
              <button onClick={() => setFoundingPet(null)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Please leave your contact information or a message about where you found {foundingPet.pet_name || 'this pet'}. The owner will see this message.</p>
            <form onSubmit={handleFound} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Message / Contact Info</label>
                <textarea required value={foundMessage} onChange={e => setFoundMessage(e.target.value)} rows={4} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" placeholder="E.g., I found your pet! Please contact me at..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setFoundingPet(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow disabled:opacity-50">
                  {uploading ? 'Sending...' : 'Mark as Found'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => r.status === 'resolved' ? setSelectedReport(r) : null}
            className={`glass rounded-xl overflow-hidden card-hover flex flex-col ${r.status === 'resolved' ? 'cursor-pointer ring-1 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}>
            <div className={`h-1.5 ${r.status === 'resolved' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} />
            {r.photo_url && (
              <div className="aspect-square overflow-hidden relative">
                <img src={r.photo_url} alt={r.pet_name || 'Pet'} className="h-full w-full object-cover" />
                {r.status === 'resolved' && (
                  <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <span className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">View Details</span>
                  </div>
                )}
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-white">{r.type === 'lost' ? `Lost: ${r.pet_name || 'Unknown'}` : `FOUND: ${r.pet_name || 'Unknown'}`}</h3>
                  {r.status === 'resolved' ? (
                    <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 badge-success border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      PET FOUND ✅
                    </span>
                  ) : (
                    <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 badge-danger">
                      STILL LOST
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-400 flex-1 line-clamp-2">{getOriginalDescription(r.description)}</p>
              <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{r.location}</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{format(new Date(r.date), 'PP')}</div>
              </div>
              
              {r.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <button onClick={(e) => { e.stopPropagation(); setFoundingPet(r); }}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all flex items-center justify-center gap-2">
                    I Found This Pet
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full text-center py-16 glass rounded-xl">
            <Search className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-3 text-sm font-medium text-gray-300">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">There are currently no lost or found pet reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};
