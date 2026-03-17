import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadFile } from '../supabase';
import { motion } from 'motion/react';
import { Plus, X, PawPrint, ImagePlus } from 'lucide-react';
import { ImageCropper } from '../components/ImageCropper';

export const Pets = () => {
  const { user, profile } = useAuth();
  const [pets, setPets] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPet, setNewPet] = useState({ name: '', breed: '', age: '', gender: 'Unknown', medicalNotes: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchPets = async () => {
    if (!user || !profile) return;
    let query = supabase.from('pets').select('*');
    if (profile.role === 'owner') query = query.eq('owner_id', user.id);
    const { data } = await query;
    if (data) setPets(data);
  };

  useEffect(() => {
    fetchPets();
    const ch = supabase.channel('pets-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, () => fetchPets()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, profile]);

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadFile('pets', photoFile);
      const { error } = await supabase.from('pets').insert({ name: newPet.name, breed: newPet.breed, age: parseInt(newPet.age) || 0, gender: newPet.gender, medical_notes: newPet.medicalNotes, owner_id: user.id, photo_url });
      if (!error) { setIsAdding(false); setNewPet({ name: '', breed: '', age: '', gender: 'Unknown', medicalNotes: '' }); setPhotoFile(null); fetchPets(); }
    } finally { setUploading(false); }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setRawFile(f);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile?.role === 'owner' ? 'My Pets' : 'Patients'}</h1>
          <p className="text-gray-400 text-sm mt-1">{pets.length} {pets.length === 1 ? 'pet' : 'pets'} registered</p>
        </div>
        {profile?.role === 'owner' && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow">
            <Plus className="-ml-1 mr-2 h-4 w-4" /> Add Pet
          </motion.button>
        )}
      </div>

      {/* Crop modal */}
      {rawFile && <ImageCropper file={rawFile} onCrop={(f) => { setPhotoFile(f); setRawFile(null); }} onCancel={() => setRawFile(null)} />}

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-md w-full glow-brand-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Add New Pet</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-300 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddPet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Photo</label>
                <label className="flex items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-dashed border-white/10 hover:border-emerald-500/30 cursor-pointer transition-colors overflow-hidden">
                  {photoFile ? (
                    <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center text-gray-500"><ImagePlus className="h-6 w-6 mx-auto mb-1" /><span className="text-xs">Click to upload</span></div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                <input type="text" required value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Breed</label>
                <input type="text" required value={newPet.breed} onChange={e => setNewPet({...newPet, breed: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Age</label>
                  <input type="number" required value={newPet.age} onChange={e => setNewPet({...newPet, age: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Gender</label>
                  <select value={newPet.gender} onChange={e => setNewPet({...newPet, gender: e.target.value})} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm">
                    <option>Male</option><option>Female</option><option>Unknown</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Medical Notes</label>
                <textarea value={newPet.medicalNotes} onChange={e => setNewPet({...newPet, medicalNotes: e.target.value})} rows={3} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet, i) => (
          <motion.div key={pet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl card-hover">
            <div className="p-5">
              <div className="flex items-center gap-4">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="h-14 w-14 rounded-xl object-cover shadow-lg" />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {pet.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-white">{pet.name}</h3>
                  <p className="text-sm text-gray-400">{pet.breed} • {pet.age} yrs • {pet.gender}</p>
                </div>
              </div>
              {pet.medical_notes && (
                <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Medical Notes</h4>
                  <p className="text-sm text-gray-300">{pet.medical_notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {pets.length === 0 && (
          <div className="col-span-full text-center py-16 glass rounded-xl">
            <PawPrint className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-3 text-sm font-medium text-gray-300">No pets found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new pet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
