"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ShieldAlert, Activity, Navigation, Clock, UserCheck, Phone, Plus, Trash2, Flame, HeartPulse, User, MessageSquare, X, WifiOff } from "lucide-react";
import { collection, addDoc, serverTimestamp, doc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Chat from "@/components/Chat";

const LiveMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800 flex items-center justify-center text-blue-400 font-bold">Initializing Radar...</div>
});

interface Contact { name: string; phone: string; }
interface UserProfile { name: string; age: string; weight: string; height: string; bloodGroup: string; medicalInfo: string; }

// --- MATH FUNCTION FOR BACKGROUND NOTIFICATIONS ---
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

export default function Home() {
  const { location, error } = useGeolocation();
  const [status, setStatus] = useState<"idle" | "sending" | "searching" | "dispatched">("idle");
  const [eta, setEta] = useState<number | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  const [showTooltip, setShowTooltip] = useState(false);

  const [responderInfo, setResponderInfo] = useState<{name: string, phone: string} | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [formData, setFormData] = useState<UserProfile>({ name: "", age: "", weight: "", height: "", bloodGroup: "", medicalInfo: "" });

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const savedContacts = localStorage.getItem("emergencyContacts");
    if (savedContacts) setContacts(JSON.parse(savedContacts));
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    setIsCheckingProfile(false);
  }, []);

  useEffect(() => {
    if (!incidentId) return;
    const unsubscribe = onSnapshot(doc(db, "incidents", incidentId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === "accepted" && status !== "dispatched") {
          setStatus("dispatched");
          if (data.acceptedBy) setResponderInfo(data.acceptedBy);
          if (eta === null) setEta(Math.floor(Math.random() * 4) + 2); 
        }
      } else {
        if (status !== "idle") {
          setStatus("idle");
          setResponderInfo(null);
          setIncidentId(null);
          setIsChatOpen(false);
        }
      }
    });
    return () => unsubscribe();
  }, [incidentId, status, eta]);

  useEffect(() => {
    if (status === "dispatched" && eta !== null && eta > 0) {
      const timer = setInterval(() => setEta(prev => (prev ? prev - 1 : 0)), 60000);
      return () => clearInterval(timer);
    }
  }, [status, eta]);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile(formData);
    localStorage.setItem("userProfile", JSON.stringify(formData));
  };

  const addContact = () => {
    if (newName.trim() && newPhone.trim()) {
      const updated = [...contacts, { name: newName, phone: newPhone }];
      setContacts(updated);
      localStorage.setItem("emergencyContacts", JSON.stringify(updated));
      setNewName("");
      setNewPhone("");
    }
  };

  const removeContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    localStorage.setItem("emergencyContacts", JSON.stringify(updated));
  };

  const triggerSMSFallback = () => {
    const lat = location ? location[0] : "Unknown";
    const lng = location ? location[1] : "Unknown";
    const mapLink = location ? `https://maps.google.com/?q=${lat},${lng}` : "Location unavailable";
    
    let message = `URGENT SOS! I need help immediately. My location: ${mapLink}.`;
    if (userProfile) {
      message += ` Vitals: ${userProfile.bloodGroup}, Allergies/Med: ${userProfile.medicalInfo || "None"}.`;
    }

    const phoneNumbers = contacts.map(c => c.phone).join(',');
    const fallbackNumber = phoneNumbers || "100"; 
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const smsUri = `sms:${fallbackNumber}${separator}body=${encodeURIComponent(message)}`;
    
    window.location.href = smsUri;
    setStatus("idle");
  };

  const handleSOS = async () => {
    if (!location) return alert("Still acquiring GPS signal. Please wait a second and try again!");
    
    if (isOffline) {
      alert("No internet connection detected. Initiating Deadzone Protocol (SMS Fallback).");
      triggerSMSFallback();
      return;
    }

    setStatus("sending");
    try {
      // 1. Create the incident in the database
      const docRef = await addDoc(collection(db, "incidents"), {
        location: { latitude: location[0], longitude: location[1] },
        status: "active", 
        emergencyType: "general", 
        contacts: contacts, 
        userProfile: userProfile, 
        timestamp: serverTimestamp(),
      });
      setIncidentId(docRef.id);
      setStatus("searching");

      // 2. Trigger the Push Notifications to all Volunteers
      const volSnapshot = await getDocs(collection(db, "volunteers"));
      const tokens: string[] = [];
      let closestDistance = Infinity;

      volSnapshot.forEach((doc) => {
        const vol = doc.data();
        if (vol.fcmToken && vol.lat && vol.lng) {
          tokens.push(vol.fcmToken);
          const dist = getDistanceInMeters(location[0], location[1], vol.lat, vol.lng);
          if (dist < closestDistance) closestDistance = dist;
        }
      });

      if (tokens.length > 0) {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: tokens,
            distance: closestDistance === Infinity ? "unknown" : closestDistance,
            emergencyType: "Medical"
          })
        });
      }

    } catch (err) {
      console.error(err);
      alert("Data network failed to reach Command Center. Initiating Deadzone Protocol (SMS Fallback).");
      triggerSMSFallback();
    }
  };

  if (isCheckingProfile) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Activity className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  if (!userProfile) {
    return (
      <main suppressHydrationWarning className="min-h-screen relative text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden">
        <div className="fixed inset-0 z-[-1] bg-[#020617] overflow-hidden">
          <style>{`
            @keyframes mesh1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(50px, 80px) scale(1.1); } }
            @keyframes mesh2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-80px, -50px) scale(1.15); } }
            .blob-1 { animation: mesh1 15s ease-in-out infinite; }
            .blob-2 { animation: mesh2 18s ease-in-out infinite; }
          `}</style>
          <div className="blob-1 absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] bg-blue-700/20 rounded-full blur-[120px]"></div>
          <div className="blob-2 absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-indigo-600/15 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80 pointer-events-none"></div>
        </div>

        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
          <div className="flex justify-center mb-6"><HeartPulse className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" /></div>
          <h1 className="text-2xl font-black text-center mb-2 tracking-tight">Medical ID Setup</h1>
          <p className="text-slate-400 text-sm text-center mb-8">This information is sent directly to emergency responders when you trigger an SOS.</p>
          <form suppressHydrationWarning onSubmit={saveProfile} className="flex flex-col gap-4 relative z-10">
            <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors backdrop-blur-sm" />
            <div className="grid grid-cols-2 gap-4">
              <input required type="number" placeholder="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors backdrop-blur-sm" />
              <select required value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none appearance-none text-slate-300 transition-colors backdrop-blur-sm">
                <option value="" disabled>Blood Group</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required type="number" placeholder="Weight (kg)" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors backdrop-blur-sm" />
              <input required type="number" placeholder="Height (cm)" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors backdrop-blur-sm" />
            </div>
            <textarea placeholder="Medical conditions, allergies, or medications..." value={formData.medicalInfo} onChange={e => setFormData({...formData, medicalInfo: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none h-24 resize-none transition-colors backdrop-blur-sm" />
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_10px_40px_rgba(37,99,235,0.6)]">Save Medical ID & Continue</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main suppressHydrationWarning className="min-h-screen relative text-white flex flex-col items-center selection:bg-blue-500/30 overflow-hidden">
      
      <div className="fixed inset-0 z-[-1] bg-[#020617] overflow-hidden">
        <style>{`
          @keyframes mesh1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(50px, 80px) scale(1.1); } }
          @keyframes mesh2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-80px, -50px) scale(1.15); } }
          .blob-1 { animation: mesh1 15s ease-in-out infinite; }
          .blob-2 { animation: mesh2 18s ease-in-out infinite; }
        `}</style>
        
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] rounded-full blur-[140px] transition-all duration-[2000ms] ease-in-out
          ${status === 'dispatched' ? 'bg-emerald-600/25 animate-pulse' : 
            status === 'searching' ? 'bg-amber-500/20 animate-pulse' : 
            status === 'sending' ? 'bg-red-600/20' : 
            'bg-blue-500/10'}`} 
          style={{ animationDuration: '4s' }}
        />
        
        <div className={`blob-1 absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] rounded-full blur-[120px] transition-colors duration-1000 ${status === 'dispatched' ? 'bg-emerald-800/20' : status === 'idle' ? 'bg-blue-700/20' : 'bg-red-800/10'}`}></div>
        <div className={`blob-2 absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full blur-[100px] transition-colors duration-1000 ${status === 'dispatched' ? 'bg-teal-700/20' : status === 'idle' ? 'bg-indigo-600/15' : 'bg-orange-800/10'}`}></div>
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80 pointer-events-none"></div>
      </div>

      <nav className="w-full border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="relative flex flex-col items-start z-50">
            <div 
              className="flex items-center gap-2 font-black tracking-widest text-lg cursor-pointer pointer-events-auto"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <ShieldAlert className="text-blue-500 w-5 h-5 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-[pulse_2s_ease-in-out_infinite]" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-md select-none">
                sAhAyAk
              </span>
            </div>
            
            {showTooltip && (
              <div className="absolute top-full mt-2 left-0 w-max bg-black/75 backdrop-blur-md text-white text-sm px-4 py-2 rounded-lg shadow-xl border border-white/10 transition-opacity duration-200 pointer-events-none">
                for your safety... <span className="text-[10px] text-zinc-400 ml-1">(by shashank)</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {isOffline && (
              <div className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded text-[10px] font-bold animate-pulse">
                <WifiOff className="w-3 h-3" /> Offline
              </div>
            )}
            <button onClick={() => setUserProfile(null)} className="text-xs text-slate-300 hover:text-white flex items-center gap-1"><User className="w-3 h-3"/> Profile</button>
            <a href="/volunteers" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md relative z-50 cursor-pointer pointer-events-auto">Volunteers &rarr;</a>
          </div>
        </div>
      </nav>

      <div className="w-full max-w-md flex flex-col gap-6 mt-6 px-6 pb-12 z-10">
        <div className="flex justify-center relative py-6">
          {status !== "idle" && (
            <><div className="absolute inset-0 m-auto w-64 h-64 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} /><div className="absolute inset-0 m-auto w-80 h-80 border border-red-500/10 rounded-full animate-pulse" /></>
          )}
          <button onClick={handleSOS} disabled={status !== "idle"} className={`relative z-10 w-56 h-56 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-500 ${status === "idle" ? "bg-gradient-to-b from-red-500 to-red-700 border-[8px] border-[#020617] ring-4 ring-red-900 shadow-[0_0_80px_rgba(239,68,68,0.5),inset_0_0_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95" : "bg-red-950 border-8 border-red-600 scale-95 shadow-[0_0_50px_rgba(239,68,68,0.3)]"}`}>
            <span className="text-5xl font-black tracking-widest text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">SOS</span>
            {status === "idle" && <span className="text-red-200 text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{isOffline ? "SMS Mode Active" : "Press to Send"}</span>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          <a href="tel:100" className="flex flex-col items-center justify-center gap-1 bg-slate-900/40 backdrop-blur-md border border-blue-500/20 text-blue-400 p-3 rounded-2xl active:scale-95 shadow-lg hover:bg-blue-500/20 transition-all"><ShieldAlert className="w-6 h-6" /><span className="text-[10px] font-black">POLICE</span></a>
          <a href="tel:108" className="flex flex-col items-center justify-center gap-1 bg-slate-900/40 backdrop-blur-md border border-red-500/20 text-red-400 p-3 rounded-2xl active:scale-95 shadow-lg hover:bg-red-500/20 transition-all"><Activity className="w-6 h-6" /><span className="text-[10px] font-black">MEDICAL</span></a>
          <a href="tel:101" className="flex flex-col items-center justify-center gap-1 bg-slate-900/40 backdrop-blur-md border border-orange-500/20 text-orange-400 p-3 rounded-2xl active:scale-95 shadow-lg hover:bg-orange-500/20 transition-all"><Flame className="w-6 h-6" /><span className="text-[10px] font-black">FIRE</span></a>
        </div>

        <div className="min-h-[80px] w-full flex flex-col items-center justify-center gap-4 my-2">
          
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-full pointer-events-none">
              <span className="text-[10px] font-black tracking-[0.4em] text-blue-400/70 uppercase">Stay Calm</span>
              <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-white to-slate-400 animate-[pulse_3s_ease-in-out_infinite] text-center drop-shadow-md">
                YOU ARE NOT ALONE
              </span>
            </div>
          )}

          {status === "sending" && <div className="flex items-center gap-3 bg-red-950/80 backdrop-blur-md text-red-400 px-6 py-4 rounded-2xl border border-red-500/30 w-full justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]"><Activity className="w-5 h-5 animate-bounce" /><span className="font-bold">Broadcasting Signal...</span></div>}
          {status === "searching" && <div className="flex items-center gap-3 bg-amber-950/80 backdrop-blur-md text-amber-400 px-6 py-4 rounded-2xl border border-amber-500/30 w-full justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]"><Navigation className="w-5 h-5 animate-spin" /><span className="font-bold">Locating nearby volunteers...</span></div>}
          
          {status === "dispatched" && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/40 p-5 rounded-3xl w-full flex flex-col gap-4 shadow-[0_15px_40px_rgba(16,185,129,0.2)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-emerald-400 font-bold"><UserCheck className="w-5 h-5" />Rescue En Route</div>
                <div className="flex items-center gap-1.5 text-emerald-950 bg-emerald-400 px-3 py-1 rounded-lg text-sm font-black animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]"><Clock className="w-4 h-4" /> {eta === 0 ? "Arriving Now" : `${eta} MIN`}</div>
              </div>

              {responderInfo && (
                <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-3 flex justify-between items-center my-1 shadow-inner relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40 text-emerald-400 font-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      {responderInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white drop-shadow-md">{responderInfo.name}</div>
                      <div className="text-xs text-emerald-400/90 font-bold tracking-wide">VERIFIED VOLUNTEER</div>
                    </div>
                  </div>
                  <a href={`tel:${responderInfo.phone}`} className="bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white p-3 rounded-xl transition-all shadow-[0_5px_15px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center">
                    <Phone className="w-4 h-4 fill-white" />
                  </a>
                </div>
              )}
              <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden relative border border-white/5 z-10"><div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-300 w-2/3 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(52,211,153,0.8)]" /></div>
            </div>
          )}
        </div>

        {status === "dispatched" && incidentId && (
          <div className="w-full">
            {!isChatOpen ? (
              <button 
                onClick={() => setIsChatOpen(true)}
                className="w-full bg-slate-900/80 backdrop-blur-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/80 py-4 px-6 rounded-3xl font-extrabold flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-in fade-in slide-in-from-bottom-3 duration-500 hover:scale-[1.02] active:scale-95"
              >
                <MessageSquare className="w-5 h-5 animate-bounce" /> Open Secure Chat with Responder
              </button>
            ) : (
              <div className="relative animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300 transform-gpu mb-4">
                <button 
                  onClick={() => setIsChatOpen(false)} 
                  className="absolute -top-3 -right-3 z-50 bg-red-500 text-white p-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-400 hover:scale-110 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <Chat incidentId={incidentId} role="victim" />
              </div>
            )}
          </div>
        )}

        <div className="w-full h-[280px] bg-slate-900/40 backdrop-blur-xl rounded-3xl p-2 border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative z-0 overflow-hidden"><LiveMap position={location} /></div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 w-full flex flex-col gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative overflow-hidden mt-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 relative z-10"><Phone className="w-4 h-4 text-blue-400" /> Family Contacts</h3>
          <div className="flex flex-col gap-2 relative z-10">
            {contacts.length === 0 && <span className="text-xs text-slate-400">No contacts saved yet.</span>}
            {contacts.map((contact, idx) => (
              <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                <div>
                  <div className="text-sm font-bold text-slate-100 mb-1">{contact.name}</div>
                  <div className="text-xs text-blue-400 font-mono">{contact.phone}</div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-colors"><Phone className="w-3 h-3" /> Call</a>
                  {status === "idle" && <button onClick={() => removeContact(idx)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
          
          {status === "idle" && (
            <div className="flex flex-col gap-3 mt-4 relative z-10">
              <input suppressHydrationWarning type="text" placeholder="Contact Name (e.g., Mom)" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white backdrop-blur-sm" />
              <input suppressHydrationWarning type="tel" placeholder="Phone Number" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white backdrop-blur-sm" />
              <button 
                onClick={addContact} 
                disabled={!newName.trim() || !newPhone.trim()} 
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-1"
              >
                <Plus className="w-4 h-4" /> Save Contact
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}