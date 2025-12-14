import React, { useEffect, useRef, useState } from 'react';
import { MeditationSession } from '../types';
import { Play, Pause, X, Volume2, SkipBack, Maximize2 } from 'lucide-react';
import Visualizer from './Visualizer';

interface PlayerProps {
  session: MeditationSession;
  onClose: () => void;
}

const Player: React.FC<PlayerProps> = ({ session, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScript, setShowScript] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512; 
    analyser.smoothingTimeConstant = 0.8;
    
    audioContextRef.current = ctx;
    analyserRef.current = analyser;

    return () => {
      stopAudio();
      ctx.close();
    };
  }, []);

  const playAudio = () => {
    if (!audioContextRef.current || !session.audioBuffer || !analyserRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = session.audioBuffer;
    
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    const offset = pausedAtRef.current;
    source.start(0, offset);
    
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    sourceNodeRef.current = source;
    
    source.onended = () => {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        cancelAnimationFrame(animationFrameRef.current!);
    };

    setIsPlaying(true);
    animateProgress();
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        sourceNodeRef.current = null;
        setIsPlaying(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const stopAudio = () => {
     if (sourceNodeRef.current) {
         try {
             sourceNodeRef.current.stop();
         } catch(e) { /* ignore */ }
         sourceNodeRef.current = null;
     }
     if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) pauseAudio();
    else playAudio();
  };

  const animateProgress = () => {
      if (!audioContextRef.current) return;
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      const duration = session.audioBuffer?.duration || 1;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      
      if (p < 100 && isPlaying) {
          animationFrameRef.current = requestAnimationFrame(animateProgress);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col font-kanit bg-black">
      {/* Immersive Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-[2000ms]"
        style={{ 
            backgroundImage: `url(${session.imageUrl})`,
            transform: isPlaying ? 'scale(1.05)' : 'scale(1.0)',
            opacity: 0.5
        }}
      />
      {/* Heavy gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
      
      {analyserRef.current && (
         <Visualizer analyser={analyserRef.current} isPlaying={isPlaying} />
      )}

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center p-8">
        <button onClick={() => setShowScript(!showScript)} className="text-white/60 hover:text-white text-sm tracking-widest uppercase transition-colors">
            {showScript ? 'ซ่อนบท' : 'ดูบทความ'}
        </button>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all hover:rotate-90">
          <X size={20} />
        </button>
      </div>

      {/* Center Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-8 text-center">
        <div className={`transition-all duration-700 ${showScript ? 'opacity-0 translate-y-[-20px] pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6 drop-shadow-xl tracking-tight">{session.title}</h1>
            <p className="text-teal-200/80 text-sm uppercase tracking-[0.2em]">Guided Meditation</p>
        </div>

        {/* Floating Script Overlay */}
        <div className={`absolute inset-x-8 max-w-2xl mx-auto top-1/2 -translate-y-1/2 transition-all duration-500 ${showScript ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
            <div className="glass-panel p-8 rounded-3xl max-h-[50vh] overflow-y-auto text-lg leading-relaxed text-slate-200 font-light text-left">
                {session.script}
            </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-8 pb-12">
         {/* Time */}
         <div className="flex justify-between text-xs text-slate-400 font-medium tracking-wider mb-4">
            <span>{formatTime((progress / 100) * (session.audioBuffer?.duration || 0))}</span>
            <span>{formatTime(session.audioBuffer?.duration || 0)}</span>
         </div>

         {/* Scrubber */}
         <div className="w-full h-1.5 bg-white/10 rounded-full mb-10 overflow-hidden cursor-pointer group">
            <div 
                className="h-full bg-gradient-to-r from-teal-400 to-white shadow-[0_0_15px_rgba(45,212,191,0.6)] group-hover:bg-teal-300 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
            />
         </div>

         <div className="flex items-center justify-center gap-10">
            <button className="text-white/40 hover:text-white transition-colors">
                <SkipBack size={24} />
            </button>
            
            <button 
                onClick={togglePlay}
                className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            
            <button className="text-white/40 hover:text-white transition-colors">
                <Maximize2 size={24} />
            </button>
         </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default Player;