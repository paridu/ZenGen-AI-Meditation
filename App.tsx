import React, { useState } from 'react';
import Layout from './components/Layout';
import Generator from './components/Generator';
import Player from './components/Player';
import ChatBot from './components/ChatBot';
import LiveSession from './components/LiveSession';
import { ViewState, MeditationSession } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.GENERATOR);
  const [currentSession, setCurrentSession] = useState<MeditationSession | null>(null);

  const handleSessionGenerated = (session: MeditationSession) => {
    setCurrentSession(session);
    setView(ViewState.PLAYER);
  };

  return (
    <>
      <Layout currentView={view} onNavigate={setView}>
        {view === ViewState.GENERATOR && (
          <div className="h-full flex flex-col justify-center">
             <Generator onSessionGenerated={handleSessionGenerated} />
             
             {/* Simple Library Teaser */}
             {currentSession && (
                 <div className="mt-12 text-center font-kanit">
                     <p className="text-slate-500 text-sm mb-4">ล่าสุด</p>
                     <button 
                        onClick={() => setView(ViewState.PLAYER)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 inline-flex items-center gap-4 transition-colors"
                     >
                        <div className="w-12 h-12 rounded-lg bg-cover bg-center" style={{backgroundImage: `url(${currentSession.imageUrl})`}} />
                        <div className="text-left">
                            <h4 className="text-white font-medium">{currentSession.title}</h4>
                            <p className="text-slate-400 text-xs">{Math.floor(currentSession.durationSeconds/60)} นาที • พร้อมฟัง</p>
                        </div>
                     </button>
                 </div>
             )}
          </div>
        )}

        {view === ViewState.CHAT && (
          <div className="h-full flex items-center justify-center">
            <ChatBot />
          </div>
        )}

        {view === ViewState.LIVE && (
            <LiveSession onClose={() => setView(ViewState.GENERATOR)} />
        )}
      </Layout>

      {/* Full Screen Player Overlay */}
      {view === ViewState.PLAYER && currentSession && (
        <Player 
          session={currentSession} 
          onClose={() => setView(ViewState.GENERATOR)} 
        />
      )}
    </>
  );
};

export default App;