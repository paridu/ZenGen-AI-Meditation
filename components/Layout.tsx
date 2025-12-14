import React from 'react';
import { ViewState } from '../types';
import { Sparkles, MessageCircle, Mic, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  return (
    <div className="min-h-screen flex flex-col font-kanit">
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex justify-center pointer-events-none">
        <header className="glass-panel rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto shadow-2xl shadow-black/20 w-full max-w-5xl">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(ViewState.HOME)}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="text-white h-5 w-5" />
            </div>
            <h1 className="text-lg font-medium tracking-wide text-white/90">ZenGen<span className="text-teal-400 font-light">AI</span></h1>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {[
              { id: ViewState.GENERATOR, label: 'สร้างสมาธิ', icon: LayoutDashboard },
              { id: ViewState.CHAT, label: 'ผู้ช่วย', icon: MessageCircle },
              { id: ViewState.LIVE, label: 'สนทนาสด', icon: Mic },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-5 py-2 rounded-full text-sm font-normal flex items-center gap-2 transition-all duration-300 ${
                  currentView === item.id 
                    ? 'bg-white/10 text-white shadow-inner border border-white/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <item.icon size={16} className={currentView === item.id ? 'text-teal-400' : ''} />
                {item.label}
              </button>
            ))}
          </nav>
          
          {/* Mobile Placeholder */}
          <div className="md:hidden w-8"></div> 
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 container mx-auto relative pt-24 pb-24">
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
        <nav className="glass-panel rounded-2xl p-2 flex justify-around shadow-xl shadow-black/40">
            {[
              { id: ViewState.GENERATOR, label: 'สร้าง', icon: LayoutDashboard },
              { id: ViewState.CHAT, label: 'แชท', icon: MessageCircle },
              { id: ViewState.LIVE, label: 'ไลฟ์', icon: Mic },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl w-full transition-all ${
                  currentView === item.id ? 'bg-white/10 text-teal-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] uppercase tracking-wider font-medium">{item.label}</span>
              </button>
            ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;