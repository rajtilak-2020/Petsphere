import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadFile } from '../supabase';
import { motion } from 'motion/react';
import { HeartHandshake, Plus, X, ImagePlus } from 'lucide-react';
import { ImageCropper } from '../components/ImageCropper';

export const Adoptions = () => {
  const { user, profile } = useAuth();
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAdoption, setNewAdoption] = useState({ name: '', breed: '', age: '', gender: 'Unknown', description: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchAdoptions = async () => { const { data } = await supabase.from('adoptions').select('*'); if (data) setAdoptions(data); };

  useEffect(() => {
    fetchAdoptions();
    const ch = supabase.channel('adopt-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'adoptions' }, () => fetchAdoptions()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadFile('adoptions', photoFile);
      const { error } = await supabase.from('adoptions').insert({ name: newAdoption.name, breed: newAdoption.breed, age: parseInt(newAdoption.age) || 0, gender: newAdoption.gender, description: newAdoption.description, shelter_id: user.id, status: 'available', photo_url });
      if (!error) { setIsAdding(false); setNewAdoption({ name: '', breed: '', age: '', gender: 'Unknown', description: '' }); setPhotoFile(null); fetchAdoptions(); }
    } finally { setUploading(false); }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setRawFile(f);
    e.target.value = '';
  };

  const statusBadge = (s: string) => s === 'available' ? 'badge-success' : s === 'pending' ? 'badge-warning' : 'badge-info';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Adopt a Pet</h1>
          <p className="text-gray-400 text-sm mt-1">{adoptions.filter(a => a.status === 'available').length} pets looking for homes</p>
        </div>
        {profile?.role === 'shelter' && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/20 transition-shadow">
            <Plus className="-ml-1 mr-2 h-4 w-4" /> List Pet
          </motion.button>
        )}
      </div>

      {rawFile && <ImageCropper file={rawFile} onCrop={(f) => { setPhotoFile(f); setRawFile(null); }} onCancel={() => setRawFile(null)} />}

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">List Pet for Adoption</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Photo</label>
                <label className="flex items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-dashed border-white/10 hover:border-purple-500/30 cursor-pointer transition-colors overflow-hidden">
                  {photoFile ? (
                    <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center text-gray-500"><ImagePlus className="h-6 w-6 mx-auto mb-1" /><span className="text-xs">Click to upload</span></div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
                </label>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                <input type="text" required value={newAdoption.name} onChange={e => setNewAdoption({...newAdoption, name: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Breed</label>
                <input type="text" required value={newAdoption.breed} onChange={e => setNewAdoption({...newAdoption, breed: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Age</label>
                  <input type="number" required value={newAdoption.age} onChange={e => setNewAdoption({...newAdoption, age: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Gender</label>
                  <select value={newAdoption.gender} onChange={e => setNewAdoption({...newAdoption, gender: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm">
                    <option>Male</option><option>Female</option><option>Unknown</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea required value={newAdoption.description} onChange={e => setNewAdoption({...newAdoption, description: e.target.value})} rows={3} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/20 transition-shadow disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'List Pet'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adoptions.map((pet, i) => (
          <motion.div key={pet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-xl overflow-hidden card-hover flex flex-col">
            <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center overflow-hidden">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                <HeartHandshake className="h-14 w-14 text-purple-400/40" />
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-white">{pet.name}</h3>
                  <p className="text-sm text-gray-400">{pet.breed} • {pet.age} yrs • {pet.gender}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge(pet.status)}`}>{pet.status}</span>
              </div>
              <p className="mt-3 text-sm text-gray-400 flex-1 line-clamp-2">{pet.description}</p>
              {profile?.role === 'owner' && pet.status === 'available' && (
                <button className="mt-4 w-full py-2 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                  Request Adoption
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {adoptions.length === 0 && (
          <div className="col-span-full text-center py-16 glass rounded-xl">
            <HeartHandshake className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-3 text-sm font-medium text-gray-300">No pets available</h3>
            <p className="mt-1 text-sm text-gray-500">Check back later for new listings.</p>
          </div>
        )}
      </div>
    </div>
  );
};
