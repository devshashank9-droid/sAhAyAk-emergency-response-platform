"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// The custom pulsating tactical beacon
const createPulsingIcon = () => {
  return L.divIcon({
    className: "custom-radar-icon",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-70"></div>
        <div class="relative w-4 h-4 bg-red-600 border-2 border-white rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

export default function LiveMap({ position }: { position: [number, number] | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-zinc-900/50 animate-pulse rounded-3xl"></div>;

  // Default to the center of India if no GPS is available yet
  const defaultPosition: [number, number] = [20.5937, 78.9629];
  const activePosition = position || defaultPosition;

  return (
    <>
      <style>{`
        /* 🚨 MAGIC CSS HACK: Turns the free standard map into a premium dark tactical map! */
        .tactical-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>

      <MapContainer center={activePosition} zoom={15} className="w-full h-full rounded-3xl z-0" zoomControl={false}>
        {/* Switched to the 100% free OpenStreetMap, but applying our CSS filter to the class */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="tactical-dark-tiles"
        />
        {position && (
          <Marker position={activePosition} icon={createPulsingIcon()}>
            <Popup className="custom-popup">
              <div className="font-bold text-slate-800 text-sm">Distress Signal</div>
              <div className="text-xs text-slate-500 font-mono">LIVE TRACKING</div>
            </Popup>
          </Marker>
        )}
        <MapUpdater position={activePosition} />
      </MapContainer>
    </>
  );
}