import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/gemini';
import { ChatMessage } from '../types';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'สวัสดีครับ ผมคือผู้ช่วยฝึกสติของคุณ วันนี้ให้ผมช่วยดูแลจิตใจคุณอย่างไรดี?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Format history for Gemini API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "ขออภัยครับ ระบบมีปัญหาในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden backdrop-blur-sm font-kanit">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <h3 className="font-medium text-slate-200">ผู้ช่วยฝึกสติ AI</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 flex gap-3 ${
              msg.role === 'user' 
                ? 'bg-teal-600/20 border border-teal-500/30 text-teal-100 rounded-tr-none' 
                : 'bg-slate-700/50 border border-slate-600 text-slate-200 rounded-tl-none'
            }`}>
              <div className="mt-1 flex-shrink-0">
                {msg.role === 'user' ? <User size={16} className="text-teal-400" /> : <Bot size={16} className="text-emerald-400" />}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
             <div className="bg-slate-700/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
               <Loader2 size={16} className="animate-spin text-emerald-400" />
               <span className="text-xs text-slate-400">กำลังคิด...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ถามเกี่ยวกับการทำสมาธิ หรือระบายความเครียด..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;