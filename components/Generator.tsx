import React, { useState, useEffect } from 'react';
import { GenerationParams, MeditationSession } from '../types';
import { generateMeditationScript, generateMeditationImage, generateMeditationAudio } from '../services/gemini';
import { Sparkles, Music, Image as ImageIcon, FileText, Check, Brain, Wind, Smile, Sun, Moon, Zap, User, Coffee } from 'lucide-react';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

interface GeneratorProps {
  onSessionGenerated: (session: MeditationSession) => void;
}

const Generator: React.FC<GeneratorProps> = ({ onSessionGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepPhase, setStepPhase] = useState<'idle' | 'script' | 'image' | 'audio'>('idle');
  
  const [params, setParams] = useState<GenerationParams>({
    mood: 'สงบ',
    duration: 5,
    focus: 'ลมหายใจ',
    voice: 'Kore'
  });

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(5);
    setStepPhase('script');

    try {
      const scriptPromise = generateMeditationScript(params.mood, params.duration, params.focus);
      
      const timer = setInterval(() => {
         setProgress(prev => {
           if (stepPhase === 'script' && prev < 30) return prev + 1;
           if (stepPhase === 'image' && prev < 60) return prev + 1;
           if (stepPhase === 'audio' && prev < 90) return prev + 1;
           return prev;
         });
      }, 200);

      const scriptData = await scriptPromise;
      clearInterval(timer);
      setProgress(35);
      
      setStepPhase('image');
      const imageUrl = await generateMeditationImage(scriptData.imagePrompt);
      setProgress(65);
      
      setStepPhase('audio');
      const base64Audio = await generateMeditationAudio(scriptData.script, params.voice);
      setProgress(95);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const rawBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(rawBytes, audioContext, 24000);
      setProgress(100);

      const newSession: MeditationSession = {
        id: Date.now().toString(),
        title: scriptData.title,
        script: scriptData.script,
        durationSeconds: params.duration * 60,
        imageUrl: imageUrl || 'https://picsum.photos/800/600',
        audioBuffer: audioBuffer,
        createdAt: Date.now()
      };

      setTimeout(() => {
        onSessionGenerated(newSession);
      }, 800);

    } catch (error) {
      console.error("Generation failed", error);
      alert("เกิดข้อผิดพลาดในการสร้างเซสชัน กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
      setStepPhase('idle');
      setProgress(0);
    }
  };

  const moods = [
    { id: 'สงบ', icon: Moon, color: 'from-teal-400 to-emerald-500' },
    { id: 'มีพลัง', icon: Zap, color: 'from-amber-400 to-orange-500' },
    { id: 'ผ่อนคลาย', icon: Coffee, color: 'from-indigo-400 to-purple-500' },
    { id: 'มีสมาธิ', icon: Brain, color: 'from-sky-400 to-blue-500' },
  ];

  const focuses = [
    { id: 'ลมหายใจ', label: 'การหายใจ' },
    { id: 'สแกนร่างกาย', label: 'สแกนร่างกาย' },
    { id: 'จินตภาพ', label: 'จินตภาพ' },
    { id: 'คลายความกังวล', label: 'คลายความกังวล' },
  ];

  return (
    <div className="max-w-4xl mx-auto relative min-h-[600px] flex flex-col font-kanit">
      
      {/* Main Content */}
      <div className={`transition-all duration-700 ease-out ${loading ? 'opacity-0 scale-95 pointer-events-none blur-sm' : 'opacity-100 scale-100'}`}>
        
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-4xl font-light text-white tracking-tight">ออกแบบความสงบของคุณ</h2>
          <p className="text-slate-400 font-light text-lg">AI จะสร้างสรรค์ประสบการณ์การทำสมาธิที่เหมาะกับคุณที่สุด</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left Column: Mood & Voice */}
            <div className="space-y-8">
                <section>
                    <label className="text-slate-300 text-sm font-medium mb-4 block uppercase tracking-wider">อารมณ์ของคุณวันนี้</label>
                    <div className="grid grid-cols-2 gap-4">
                        {moods.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setParams({...params, mood: m.id})}
                                className={`relative group p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden ${
                                    params.mood === m.id 
                                    ? 'bg-slate-800 border-teal-500/50 ring-1 ring-teal-500/50 shadow-lg shadow-teal-900/20' 
                                    : 'glass-panel border-transparent hover:border-slate-600 hover:bg-slate-800/50'
                                }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                                <m.icon className={`w-6 h-6 transition-colors ${params.mood === m.id ? 'text-teal-400' : 'text-slate-400'}`} />
                                <span className={`text-base font-light ${params.mood === m.id ? 'text-white' : 'text-slate-300'}`}>{m.id}</span>
                            </button>
                        ))}
                    </div>
                </section>

                 <section>
                    <label className="text-slate-300 text-sm font-medium mb-4 block uppercase tracking-wider">เสียงนำทาง</label>
                    <div className="flex gap-3 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                        {['Kore', 'Fenrir', 'Puck', 'Zephyr'].map(v => (
                            <button
                                key={v}
                                onClick={() => setParams({...params, voice: v})}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                    params.voice === v 
                                    ? 'bg-slate-800 text-teal-400 shadow-sm border border-slate-700' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* Right Column: Focus & Duration */}
            <div className="space-y-8">
                <section>
                    <label className="text-slate-300 text-sm font-medium mb-4 block uppercase tracking-wider">โฟกัสหลัก</label>
                    <div className="space-y-3">
                        {focuses.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setParams({...params, focus: f.id})}
                                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                    params.focus === f.id
                                    ? 'bg-gradient-to-r from-teal-500/10 to-transparent border-teal-500/30 text-white'
                                    : 'glass-panel border-transparent text-slate-400 hover:bg-slate-800/50'
                                }`}
                            >
                                <span className="text-base font-light">{f.label}</span>
                                {params.focus === f.id && <Check className="text-teal-400 w-5 h-5" />}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-end mb-4">
                        <label className="text-slate-300 text-sm font-medium uppercase tracking-wider">ระยะเวลา</label>
                        <span className="text-2xl font-light text-white">{params.duration} <span className="text-sm text-slate-500 font-normal">นาที</span></span>
                    </div>
                    <div className="px-2">
                        <input
                            type="range"
                            min="1"
                            max="15"
                            value={params.duration}
                            onChange={(e) => setParams({ ...params, duration: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                        />
                         <div className="flex justify-between text-xs text-slate-600 mt-2 font-mono">
                            <span>1</span>
                            <span>5</span>
                            <span>10</span>
                            <span>15</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <div className="mt-12 flex justify-center">
            <button
                onClick={handleGenerate}
                className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium text-lg shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] hover:scale-105 transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    เริ่มต้นการเดินทาง
                </span>
            </button>
        </div>
      </div>

      {/* Modern Loading Overlay */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-700 ${
          loading ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="relative">
            {/* Pulsing Core */}
            <div className="w-64 h-64 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-teal-500/20 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-teal-500/10 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-0 rounded-full bg-teal-500/5 blur-3xl animate-pulse-slow" />
                
                <div className="text-center z-10 space-y-2">
                    <span className="text-5xl font-extralight text-white tabular-nums tracking-tight">{progress}%</span>
                    <div className="text-teal-400 text-sm font-medium tracking-widest uppercase opacity-80">
                        {stepPhase === 'script' && 'CREATING SCRIPT'}
                        {stepPhase === 'image' && 'RENDERING VISUALS'}
                        {stepPhase === 'audio' && 'SYNTHESIZING VOICE'}
                        {stepPhase === 'idle' && 'PREPARING'}
                    </div>
                </div>
            </div>
            
            {/* Status Steps */}
            <div className="mt-12 flex justify-center gap-12">
                 <StepItem active={stepPhase === 'script'} completed={progress > 35} icon={FileText} />
                 <StepItem active={stepPhase === 'image'} completed={progress > 65} icon={ImageIcon} />
                 <StepItem active={stepPhase === 'audio'} completed={progress > 95} icon={Music} />
            </div>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ active, completed, icon: Icon }: { active: boolean, completed: boolean, icon: any }) => (
    <div className={`transition-all duration-500 ${active || completed ? 'opacity-100 transform translate-y-0' : 'opacity-30 transform translate-y-2'}`}>
        <div className={`w-3 h-3 mx-auto mb-2 rounded-full ${completed ? 'bg-teal-500' : active ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
        <Icon className={`w-5 h-5 ${completed || active ? 'text-white' : 'text-slate-500'}`} />
    </div>
);

export default Generator;