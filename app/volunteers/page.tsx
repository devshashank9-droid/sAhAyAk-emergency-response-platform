"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser, setPersistence, browserLocalPersistence } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db, auth, app } from "@/lib/firebase";
import { ShieldAlert, MapPin, AlertTriangle, Volume2, VolumeX, CheckCircle2, ChevronLeft, PhoneCall, HeartPulse, Stethoscope, Droplet, Check, X, Mail, Lock, User, Phone, LogOut, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { getMessaging, getToken } from "firebase/messaging";
import Chat from "@/components/Chat";

const LiveMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900/50 animate-pulse rounded-2xl flex items-center justify-center text-red-500 font-bold">Loading Tactical Map...</div>
});

interface Contact { name: string; phone: string; }
interface UserProfile { name: string; age: string; weight: string; height: string; bloodGroup: string; medicalInfo: string; }
interface Incident { id: string; location: { latitude: number; longitude: number }; status: string; emergencyType: string; contacts?: Contact[]; userProfile?: UserProfile; }

export default function VolunteerDashboard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check if the phone remembers we logged in previously
    const hasSecureSession = localStorage.getItem("volunteer_secure_session");
    if (hasSecureSession) {
      setIsLoading(true); // Force UI shield up
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 2. Lock in the session shield on successful auth
        localStorage.setItem("volunteer_secure_session", "true");
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // 3. Prevent the "flash" bug: Wait 1.5s to see if Firebase is just lagging behind the UI
        setTimeout(() => {
          if (!auth.currentUser) {
            localStorage.removeItem("volunteer_secure_session");
            setUser(null);
            setIsLoading(false);
          }
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) return <div className="min-h-screen bg-[#020202] flex items-center justify-center"><ShieldAlert className="w-12 h-12 text-emerald-500 animate-pulse drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" /></div>;

  return user ? <CommandCenter user={user} /> : <AuthPortal />;
}

function AuthPortal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "volunteers", userCredential.user.uid), { name, phone, email, registeredAt: new Date() });
      }
      // Shield is applied in the onAuthStateChanged listener automatically
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  return (
    <main suppressHydrationWarning className="min-h-screen relative text-white flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30 overflow-hidden bg-[#020202]">
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <style>{`
          @keyframes ekg-trace { 0% { stroke-dashoffset: 2000; } 100% { stroke-dashoffset: 0; } }
          .ekg-glow { stroke-dasharray: 200 2000; animation: ekg-trace 3s linear infinite; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 1)); }
        `}</style>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute w-full h-[40vh] flex items-center opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M 0,50 H 200 L 210,30 L 225,90 L 245,-10 L 260,60 L 270,50 H 700 L 710,30 L 725,90 L 745,-10 L 760,60 L 770,50 H 1000" fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path className="ekg-glow" d="M 0,50 H 200 L 210,30 L 225,90 L 245,-10 L 260,60 L 270,50 H 700 L 710,30 L 725,90 L 745,-10 L 760,60 L 770,50 H 1000" fill="none" stroke="#ef4444" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-amber-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#020202_80%)]"></div>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 relative z-50 cursor-pointer pointer-events-auto"><ChevronLeft className="w-4 h-4" /> Back to Victim App</a>
      </div>

      <div className="max-w-md w-full bg-zinc-950/70 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
        <div className="flex justify-center mb-6"><ShieldCheck className="w-12 h-12 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" /></div>
        <h1 className="text-2xl font-black text-center mb-2 tracking-tight">Responder Access</h1>
        <p className="text-zinc-400 text-sm text-center mb-8">
          {isLogin ? "Authenticate to access the Command Center." : "Register as a verified emergency responder."}
        </p>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 text-center">{error}</div>}

        <form suppressHydrationWarning onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="relative"><User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" /><input suppressHydrationWarning required type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 outline-none backdrop-blur-sm" /></div>
              <div className="relative"><Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" /><input suppressHydrationWarning required type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 outline-none backdrop-blur-sm" /></div>
            </>
          )}
          <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" /><input suppressHydrationWarning required type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 outline-none backdrop-blur-sm" /></div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" /><input suppressHydrationWarning required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 outline-none backdrop-blur-sm" /></div>

          <button disabled={loading} type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl mt-2 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
            {loading ? "Authenticating..." : isLogin ? "Secure Login" : "Complete Registration"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors">
            {isLogin ? "Don't have access? Apply here." : "Already registered? Sign in."}
          </button>
        </div>
      </div>
    </main>
  );
}

function CommandCenter({ user }: { user: FirebaseUser }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [passedIncidents, setPassedIncidents] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const [expandedIncidents, setExpandedIncidents] = useState<string[]>([]);
  const previousCountRef = useRef<number | null>(null);
  const [volunteerProfile, setVolunteerProfile] = useState<{ name: string, phone: string } | null>(null);

  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const [triageLanguage, setTriageLanguage] = useState<"English" | "Hindi">("English");

  // Also clear the shield if they click manual logout
  const handleLogout = () => {
    localStorage.removeItem("volunteer_secure_session");
    signOut(auth);
  };

  useEffect(() => {
    const initializeGridConnection = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const messaging = getMessaging(app); 
            const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY });
            
            if (token && user?.uid) {
              await updateDoc(doc(db, "volunteers", user.uid), {
                fcmToken: token,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
            }
          }, (error) => console.error("Location error:", error));
        }
      } catch (error) {
        console.error("Error enabling background connection:", error);
      }
    };

    if (user?.uid) {
      initializeGridConnection();
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, "volunteers", user.uid));
      if (docSnap.exists()) {
        setVolunteerProfile(docSnap.data() as { name: string, phone: string });
      }
    };
    fetchProfile();
  }, [user.uid]);

  const playSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) { console.log("Audio blocked"); }
  };

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIncidents: Incident[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
      if (previousCountRef.current !== null && fetchedIncidents.length > previousCountRef.current && audioEnabled) playSiren();
      previousCountRef.current = fetchedIncidents.length;
      setIncidents(fetchedIncidents);
    });
    return () => unsubscribe();
  }, [audioEnabled]);

  const visibleIncidents = incidents.filter(inc => !passedIncidents.includes(inc.id));

  useEffect(() => {
    if (visibleIncidents.length > 0) {
      if (!selectedLocation) {
        setSelectedLocation([visibleIncidents[0].location.latitude, visibleIncidents[0].location.longitude]);
        setSelectedIncidentId(visibleIncidents[0].id);
      }
    } else {
      setSelectedLocation(null);
      setSelectedIncidentId(null);
    }
  }, [visibleIncidents, selectedLocation]);

  const generateAiTriage = async (incident: Incident, lang: string) => {
    if (!incident.userProfile) return;

    setIsAiLoading(prev => ({ ...prev, [incident.id]: true }));

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicalInfo: incident.userProfile.medicalInfo,
          bloodGroup: incident.userProfile.bloodGroup,
          age: incident.userProfile.age,
          language: lang
        })
      });

      const data = await res.json();
      setAiSummaries(prev => ({ ...prev, [incident.id]: data.summary }));
    } catch (error) {
      console.error(error);
      setAiSummaries(prev => ({ ...prev, [incident.id]: "AI currently unavailable. Follow standard emergency protocols." }));
    } finally {
      setIsAiLoading(prev => ({ ...prev, [incident.id]: false }));
    }
  };

  const handleAccept = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateDoc(doc(db, "incidents", id), {
      status: "accepted",
      acceptedBy: volunteerProfile ? { name: volunteerProfile.name, phone: volunteerProfile.phone } : { name: "Responder", phone: "Unknown" }
    });
    setSelectedIncidentId(id);
    if (!expandedIncidents.includes(id)) {
      setExpandedIncidents(prev => [...prev, id]);
    }

    const acceptedIncident = visibleIncidents.find(inc => inc.id === id);
    if (acceptedIncident && acceptedIncident.userProfile) {
      generateAiTriage(acceptedIncident, triageLanguage);
    }
  };

  const handlePass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPassedIncidents(prev => [...prev, id]);
    if (selectedIncidentId === id) { setSelectedIncidentId(null); setSelectedLocation(null); }
  };

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure this emergency is resolved and safe?")) {
      await deleteDoc(doc(db, "incidents", id));
      setSelectedLocation(null);
      if (selectedIncidentId === id) setSelectedIncidentId(null);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIncidents(prev =>
      prev.includes(id) ? prev.filter(existingId => existingId !== id) : [...prev, id]
    );
  };

  return (
    <main suppressHydrationWarning className="min-h-screen relative text-white flex flex-col selection:bg-red-500/30 bg-[#020202]">
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <style>{`
          @keyframes ekg-trace { 0% { stroke-dashoffset: 2000; } 100% { stroke-dashoffset: 0; } }
          .ekg-glow { stroke-dasharray: 200 2000; animation: ekg-trace 3s linear infinite; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 1)); }
        `}</style>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute w-full h-[40vh] flex items-center opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M 0,50 H 200 L 210,30 L 225,90 L 245,-10 L 260,60 L 270,50 H 700 L 710,30 L 725,90 L 745,-10 L 760,60 L 770,50 H 1000" fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path className="ekg-glow" d="M 0,50 H 200 L 210,30 L 225,90 L 245,-10 L 260,60 L 270,50 H 700 L 710,30 L 725,90 L 745,-10 L 760,60 L 770,50 H 1000" fill="none" stroke="#ef4444" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-amber-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#020202_80%)]"></div>
      </div>

      <nav className="w-full border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-4 relative z-10">
            <a href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 relative z-50 cursor-pointer pointer-events-auto"><ChevronLeft className="w-4 h-4" /> Back</a>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] hidden sm:block">Active ID: {volunteerProfile?.name || user.email}</span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
            <div className="flex items-center gap-2 font-black tracking-widest text-xl sm:text-2xl cursor-pointer pointer-events-auto" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} onClick={() => setShowTooltip(!showTooltip)}>
              <ShieldAlert className="text-red-500 w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(239,68,68,0.3)] select-none">
                sAhAyAk
              </span>
            </div>
            {showTooltip && (
              <div className="absolute top-full mt-2 w-max bg-black/70 backdrop-blur-md text-white text-sm px-4 py-2 rounded-lg shadow-xl border border-white/10 transition-opacity duration-200 pointer-events-none">
                for your safety... <span className="text-[10px] text-zinc-400 ml-1">(by shashank)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/20">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[90rem] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start z-10 pb-24">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">COMMAND CENTER</h1>
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-1.5 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_rgba(239,68,68,1)]" />
              <span className="text-red-400 text-xs font-bold">{visibleIncidents.length} Active</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {visibleIncidents.length === 0 ? (
              <div className="h-48 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-500 gap-3 bg-black/40 backdrop-blur-md shadow-inner"><ShieldAlert className="w-8 h-8 opacity-20" /><p className="text-sm font-medium">All clear. Standing by.</p></div>
            ) : (
              visibleIncidents.map((incident) => {
                const isExpanded = expandedIncidents.includes(incident.id);
                return (
                  <div key={incident.id} onClick={() => { setSelectedLocation([incident.location.latitude, incident.location.longitude]); setSelectedIncidentId(incident.id); }} className={`group relative bg-zinc-950/70 backdrop-blur-xl p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden ${selectedIncidentId === incident.id ? "border-red-500/50" : "border-white/10"} ${incident.status === "accepted" ? "border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : ""}`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${incident.status === "accepted" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]"}`} />
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <span className={`font-black flex items-center gap-2 text-sm tracking-wider ${incident.status === "accepted" ? "text-emerald-400" : "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"}`}>
                        {incident.status === "accepted" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
                        {incident.status === "accepted" ? "RESPONDING" : "URGENT DISTRESS"}
                      </span>
                      <div className="flex gap-2">
                        {incident.status === "active" ? (
                          <>
                            <button onClick={(e) => handleAccept(incident.id, e)} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"><Check className="w-3 h-3" /> Accept</button>
                            <button onClick={(e) => handlePass(incident.id, e)} className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Pass</button>
                          </>
                        ) : (
                          <button onClick={(e) => handleResolve(incident.id, e)} className="bg-zinc-800/80 hover:bg-emerald-600 hover:text-white text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolve</button>
                        )}
                      </div>
                    </div>
                    <div className="bg-black/60 p-3.5 rounded-xl border border-white/5 space-y-1 ml-2 shadow-inner">
                      <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Coordinates</div>
                      <div className="text-sm text-zinc-200 font-mono flex items-center gap-2"><MapPin className={`w-4 h-4 ${incident.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`} /> {incident.location.latitude.toFixed(5)}, {incident.location.longitude.toFixed(5)}</div>
                    </div>
                    <button onClick={(e) => toggleExpand(incident.id, e)} className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors ml-1">
                      {isExpanded ? <><ChevronUp className="w-4 h-4" /> Hide Details</> : <><ChevronDown className="w-4 h-4" /> More Info</>}
                    </button>
                    {isExpanded && (
                      <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ml-2">
                        {incident.status === 'accepted' && incident.userProfile?.medicalInfo && (
                          <div className="relative overflow-hidden bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(99,102,241,0.15)] mt-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-3 relative z-10 border-b border-indigo-500/20 pb-2">
                              <div className="flex items-center gap-2 font-black text-sm text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"><Sparkles className="w-4 h-4" /> AI SMART TRIAGE</div>
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setTriageLanguage("English"); generateAiTriage(incident, "English"); }} className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${triageLanguage === 'English' ? 'bg-indigo-600 text-white' : 'bg-indigo-950 text-indigo-300'}`}>EN</button>
                                <button onClick={(e) => { e.stopPropagation(); setTriageLanguage("Hindi"); generateAiTriage(incident, "Hindi"); }} className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${triageLanguage === 'Hindi' ? 'bg-indigo-600 text-white' : 'bg-indigo-950 text-indigo-300'}`}>HI</button>
                              </div>
                            </div>
                            <div className="relative z-10 min-h-[40px] flex items-center">
                              {isAiLoading[incident.id] ? (
                                <div className="text-xs text-indigo-300 animate-pulse flex items-center gap-2"><div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>Gemini is analyzing medical history...</div>
                              ) : aiSummaries[incident.id] ? (
                                <p className="text-sm font-semibold text-indigo-100 leading-relaxed bg-black/30 p-3 rounded-lg border border-indigo-500/10 shadow-inner">{aiSummaries[incident.id]}</p>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); generateAiTriage(incident, triageLanguage); }} className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold transition-colors">Generate Triage Plan</button>
                              )}
                            </div>
                          </div>
                        )}
                        {incident.userProfile ? (
                          <div className={`${incident.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} p-4 rounded-xl border space-y-3 shadow-inner transition-colors`}>
                            <div className={`flex justify-between items-center border-b pb-2 ${incident.status === 'accepted' ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                              <div className={`flex items-center gap-2 font-bold text-sm ${incident.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}><HeartPulse className="w-4 h-4" /> MEDICAL ID</div>
                              <div className={`flex items-center gap-1 text-white px-2 py-0.5 rounded text-xs font-bold ${incident.status === 'accepted' ? 'bg-emerald-600' : 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}><Droplet className="w-3 h-3" /> {incident.userProfile.bloodGroup}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                              <div><span className={`font-semibold block mb-0.5 ${incident.status === 'accepted' ? 'text-emerald-400/70' : 'text-red-400/70'}`}>Victim Name</span> {incident.userProfile.name}</div>
                              <div><span className={`font-semibold block mb-0.5 ${incident.status === 'accepted' ? 'text-emerald-400/70' : 'text-red-400/70'}`}>Vitals</span> {incident.userProfile.age} yrs • {incident.userProfile.height} cm • {incident.userProfile.weight} kg</div>
                            </div>
                            {incident.userProfile.medicalInfo && (
                              <div className={`pt-3 mt-1 border-t ${incident.status === 'accepted' ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                                <span className={`font-semibold text-xs flex items-center gap-1 mb-1 ${incident.status === 'accepted' ? 'text-emerald-400/70' : 'text-red-400/70'}`}><Stethoscope className="w-3 h-3" /> Medical Info / Allergies:</span>
                                <p className="text-xs text-white font-medium bg-black/40 p-2 rounded-lg border border-white/5">{incident.userProfile.medicalInfo}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-black/50 p-3 rounded-xl border border-white/5 text-xs text-zinc-500 italic text-center shadow-inner">No Medical ID attached to this signal.</div>
                        )}
                        {incident.contacts && incident.contacts.length > 0 && (
                          <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2 shadow-inner">
                            <div className="text-xs text-blue-400 uppercase font-black tracking-wider flex items-center gap-1"><PhoneCall className="w-3 h-3" /> Family Contacts</div>
                            {incident.contacts.map((contact, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-sm text-zinc-200 font-bold">{contact.name}</span>
                                <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors">Call {contact.phone}</a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4 h-[85vh] sticky top-24 z-10">
          <div className="flex-[2] min-h-[400px] bg-zinc-950/70 backdrop-blur-2xl rounded-3xl p-2 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center justify-center overflow-hidden">
            {visibleIncidents.length > 0 && selectedLocation ? (
              <div className="w-full h-full rounded-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-500"><LiveMap position={selectedLocation} /></div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 gap-6 w-full h-full absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]">
                <div className="relative flex items-center justify-center w-40 h-40">
                  <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                  <div className="absolute inset-4 border border-emerald-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute inset-8 border border-emerald-500/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '2s' }}></div>
                  <ShieldAlert className="w-8 h-8 text-zinc-700 opacity-50" />
                </div>
                <div className="flex flex-col items-center gap-1"><span className="text-sm font-black tracking-[0.3em] uppercase text-zinc-500">Radar Standby</span><span className="text-xs text-zinc-600 font-mono">AWAITING DISTRESS SIGNALS</span></div>
              </div>
            )}
          </div>
          {selectedIncidentId && visibleIncidents.find(i => i.id === selectedIncidentId)?.status === 'accepted' && (
            <div className="flex-[1] shrink-0 animate-in slide-in-from-bottom-4 fade-in duration-500"><Chat incidentId={selectedIncidentId} role="volunteer" /></div>
          )}
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[100]">
        {audioEnabled ? (
          <button onClick={() => setAudioEnabled(false)} className="bg-red-600/90 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md transition-all border border-red-500 flex items-center gap-2"><Volume2 className="w-4 h-4 animate-pulse" /> Disable Siren</button>
        ) : (
          <button onClick={() => { setAudioEnabled(true); playSiren(); }} className="bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-full text-sm font-bold shadow-xl backdrop-blur-md transition-all border border-white/10 flex items-center gap-2"><VolumeX className="w-4 h-4" /> Enable Siren</button>
        )}
      </div>
    </main>
  );
}