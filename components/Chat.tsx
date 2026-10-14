"use client";
import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Send } from "lucide-react";

export default function Chat({ incidentId, role }: { incidentId: string, role: "victim" | "volunteer" }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = role === "volunteer" 
    ? [
        "🧘‍♂ Stay calm, help is on the way.", 
        "🚑 Dispatching ambulance/police now.",
        "🔒 Find a safe room, lock the door & hide.", 
        "🏃‍♂️ Move to an open area immediately.", 
        "🫁 Sit down and try to breathe slowly.", 
        "🩸 Can you apply pressure to any wounds?", 
        "📍 I have your exact live location."
      ]
    : [
        "💥 Major accident! Need help fast.",
        "💔 Heart attack / Severe chest pain!",
        "🏚️ Earthquake! I am trapped.",
        "⚠️ I am in danger / Threat of assault!",
        "🔥 Fire breaking out!",
        "🤐 Please hurry, I can't talk."
      ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const q = query(collection(db, "incidents", incidentId, "messages"), orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        let safeDate = new Date();
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          safeDate = data.createdAt.toDate();
        }
        return { id: doc.id, ...data, createdAt: safeDate };
      });
      
      setMessages(fetchedMsgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    
    return () => unsubscribe();
  }, [incidentId]);

  const sendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || newMessage;
    if (!text.trim()) return;
    if (!textOverride) setNewMessage(""); 

    try {
      await addDoc(collection(db, "incidents", incidentId, "messages"), {
        text,
        sender: role,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Message failed to send:", error);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[350px] bg-black border border-white/10 rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative z-10">
      
      {/* 🚨 UPDATED: Much more visible 3D Perspective Grid Background */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none rounded-3xl opacity-100">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black"></div>
        
        {/* 3D Floor inside the chat - Increased line opacity from 0.04 to 0.12 */}
        <div 
          className="absolute w-full h-[200%] top-0 left-0" 
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'perspective(400px) rotateX(60deg) translateY(-50px) scale(2.5)',
            transformOrigin: 'top center'
          }}
        ></div>
        
        {/* Stronger center glow to create more depth contrast against the grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/20 blur-[50px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar relative z-10">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`max-w-[80%] flex flex-col relative ${msg.sender === role ? "self-end" : "self-start"}`}>
            <div className={`px-4 py-2.5 text-[15px] shadow-lg ${msg.sender === role ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-tr-sm" : "bg-zinc-800/90 backdrop-blur-md text-zinc-100 rounded-2xl rounded-tl-sm border border-white/10"}`}>
              {msg.text}
              <div className={`text-[10px] mt-1 font-semibold ${msg.sender === role ? "text-emerald-100/70 text-right" : "text-zinc-400 text-left"}`}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar relative z-10">
        {quickReplies.map((reply, idx) => (
          <button 
            key={idx} 
            onClick={() => sendMessage(undefined, reply)}
            className={`text-sm px-4 py-2 rounded-xl transition-all font-medium shadow-sm border ${role === 'victim' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-200 border-red-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border-emerald-500/30'}`}
          >
            {reply}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => sendMessage(e)} className="p-2.5 bg-black/90 backdrop-blur-2xl border-t border-white/5 flex gap-2 relative z-10">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" 
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white w-14 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </form>
    </div>
  );
}