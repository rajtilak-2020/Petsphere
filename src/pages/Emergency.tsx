import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { AlertTriangle, Phone, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const Emergency = () => {
  const [vets, setVets] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'vet');
      if (data) setVets(data);
    })();
    setUserLocation([37.7749, -122.4194]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center glow-red">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-red-400">Emergency SOS</h1>
          <p className="text-gray-400 text-sm">Find nearby veterinary help immediately</p>
        </div>
      </div>

      <div className="glass-light rounded-lg border-red-500/20 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-300/80">If your pet is experiencing a life-threatening emergency, please contact the nearest 24/7 veterinary hospital immediately.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass rounded-xl overflow-hidden h-96 z-0">
          {userLocation && (
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={userLocation}><Popup>Your Location</Popup></Marker>
              {vets.map((vet, idx) => (
                <Marker key={vet.id} position={[userLocation[0] + (idx * 0.01), userLocation[1] + (idx * 0.01)]}>
                  <Popup><strong>{vet.name}</strong><br/>{vet.phone || 'No phone'}</Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Nearby Vets</h2>
          {vets.map((vet, i) => (
            <motion.div key={vet.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4 card-hover">
              <h3 className="text-sm font-semibold text-white">{vet.name}</h3>
              <div className="mt-2 space-y-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-500" />{vet.location || 'N/A'}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-500" />{vet.phone || 'N/A'}</div>
              </div>
            </motion.div>
          ))}
          {vets.length === 0 && (
            <div className="text-center py-8 glass rounded-xl">
              <p className="text-sm text-gray-500">No vets found nearby.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};