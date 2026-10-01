import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore
import { collection, onSnapshot, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { UserLocation } from '../types';

// Fix Leaflet icon issue by using CDN URLs
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
};

const RecenterMap = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

interface LiveMapProps {
  locationStatus?: 'tracking' | 'error' | 'denied' | 'idle';
}

const LiveMap: React.FC<LiveMapProps> = ({ locationStatus }) => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [center, setCenter] = useState<[number, number]>([-25.7479, 28.2293]); // Default to Pretoria/SA area

  useEffect(() => {
    const q = query(collection(db, "locations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locs = snapshot.docs.map(doc => ({
        ...doc.data()
      } as UserLocation));
      setLocations(locs);
      
      // If we have locations, center on the first one if we haven't moved yet
      if (locs.length > 0) {
        setCenter([locs[0].latitude, locs[0].longitude]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-[#0d1117]">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.uid} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <div className="text-slate-900">
                <p className="font-bold">{loc.email}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Last Updated: {loc.lastUpdated?.toDate ? loc.lastUpdated.toDate().toLocaleTimeString() : 'Just now'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        <RecenterMap position={center} />
        <MapResizer />
      </MapContainer>
      
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/60 backdrop-blur-sm z-[1001]">
          <div className="text-center p-8 bg-[#161b22] rounded-3xl border border-slate-800 shadow-2xl">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">
              {locationStatus === 'denied' ? 'GPS Permission Denied' : 'No Active Trackers'}
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {locationStatus === 'denied' 
                ? 'Please enable location permissions in your browser settings to share your position.' 
                : 'Staff must have the app open and GPS enabled to appear on the map.'}
            </p>
          </div>
        </div>
      )}
      
      {/* Overlay Info */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#161b22]/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl max-w-[200px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live Fleet</h3>
          <button 
            onClick={() => window.location.reload()} 
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-blue-400"
            title="Full Page Reload"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {locations.map(loc => (
            <div key={loc.uid} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-bold text-slate-300 truncate">{loc.email}</span>
            </div>
          ))}
          {locations.length === 0 && (
            <p className="text-[9px] text-slate-500 italic">No active trackers...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
