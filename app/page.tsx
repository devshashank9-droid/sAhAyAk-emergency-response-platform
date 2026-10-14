"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, User, HeartHandshake, Loader2, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"victim" | "volunteer">("victim");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      
      if (role === "victim") {
        router.push("/victim");
      } else {
        router.push("/volunteers");
      }
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden bg-[#020617]">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] bg-blue-700/20 rounded-full blur-[120px] animate-[pulse_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-emerald-600/15 rounded-full blur-[100px] animate-[pulse_18s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 mb-4">
          <ShieldAlert className="text-blue-500 w-12 h-12 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 drop-shadow-md">
            sAhAyAk
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">Tactical Emergency Response Platform</p>
        </div>

        <div className="flex bg-black/40 border border-white/10 p-1 rounded-2xl backdrop-blur-xl">
          <button
            onClick={() => setRole("victim")}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              role === "victim" ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> I Need Help
          </button>
          <button
            onClick={() => setRole("volunteer")}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              role === "volunteer" ? "bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "text-slate-400 hover:text-white"
            }`}
          >
            <HeartHandshake className="w-4 h-4" /> Responder
          </button>
        </div>

        <form onSubmit={handleAuth} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center mb-2">
            {isLogin ? `Access ${role === 'victim' ? 'Victim' : 'Command'} Portal` : `Register as ${role === 'victim' ? 'Victim' : 'Responder'}`}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black tracking-wide flex items-center justify-center gap-2 mt-2 transition-all shadow-lg ${
              role === "victim"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_10px_30px_rgba(37,99,235,0.3)]"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLogin ? "SECURE LOGIN" : "CREATE ACCOUNT"} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}