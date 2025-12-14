import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, X } from 'lucide-react';
import { connectLiveSession } from '../services/gemini';
import { createPcmBlob, decodeBase64, decodeAudioData } from '../utils/audioUtils';

interface LiveSessionProps {
    onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
    const [volume, setVolume] = useState(0);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<Promise<any> | null>(null);

    const startSession = async () => {
        try {
            setStatus('connecting');
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

            const sessionPromise = connectLiveSession(
                () => { // onOpen
                    setStatus('active');
                    setIsActive(true);
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        let sum = 0;
                        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                        setVolume(Math.sqrt(sum / inputData.length) * 5); 

                        const pcmBlob = createPcmBlob(inputData);
                        
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    
                    source.connect(processor);
                    processor.connect(inputAudioContextRef.current!.destination);
                },
                async (message: any) => { // onMessage
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const audioBuffer = await decodeAudioData(
                            decodeBase64(base64Audio), 
                            outputAudioContextRef.current, 
                            24000
                        );
                        
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);
                        
                        const currentTime = outputAudioContextRef.current.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        
                        sourcesRef.current.add(source);
                        source.onended = () => sourcesRef.current.delete(source);
                    }
                    
                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => {
                            try { s.stop(); } catch(e){}
                        });
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                (e) => { // onClose
                    console.log("Closed", e);
                    stopSession();
                },
                (e) => { // onError
                    console.error("Error", e);
                    setStatus('error');
                    stopSession();
                }
            );

            sessionRef.current = sessionPromise;

        } catch (error) {
            console.error("Failed to start session", error);
            setStatus('error');
            stopSession();
        }
    };

    const stopSession = () => {
        setIsActive(false);
        setStatus('idle');
        setVolume(0);

        if (sessionRef.current) {
            sessionRef.current.then(session => {
                try { session.close(); } catch(e) {}
            });
            sessionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        
        sourcesRef.current.clear();
    };

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md font-kanit">
            <div className="w-full max-w-md bg-black/40 p-8 rounded-3xl border border-white/10 flex flex-col items-center relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-light text-white mb-2">สนทนาสดกับโค้ช</h2>
                    <p className="text-slate-400 text-sm">พูดคุยโต้ตอบแบบ Real-time เพื่อขอคำแนะนำ</p>
                </div>

                {/* Visualizer Circle */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-10">
                    {isActive && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping opacity-75" style={{ animationDuration: '3s' }}></div>
                            <div className="absolute inset-4 rounded-full bg-teal-500/20 animate-ping opacity-75" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                        </>
                    )}
                    
                    <div 
                        className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive ? 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-[0_0_40px_rgba(20,184,166,0.4)]' : 'bg-slate-800 border border-slate-700'
                        }`}
                        style={{
                            width: isActive ? `${100 + volume * 50}px` : '100px',
                            height: isActive ? `${100 + volume * 50}px` : '100px',
                        }}
                    >
                         {status === 'connecting' ? (
                             <Activity className="animate-spin text-white" size={32} />
                         ) : isActive ? (
                            <Mic size={32} className="text-white" />
                         ) : (
                            <MicOff size={24} className="text-slate-500" />
                         )}
                    </div>
                </div>

                {status === 'error' && (
                    <p className="text-red-400 mb-6 text-sm">การเชื่อมต่อล้มเหลว กรุณาตรวจสอบไมโครโฟน</p>
                )}

                <button
                    onClick={isActive ? stopSession : startSession}
                    className={`px-8 py-3 rounded-full font-medium transition-all ${
                        isActive 
                        ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/50' 
                        : 'bg-white text-slate-900 hover:scale-105 shadow-lg shadow-white/10'
                    }`}
                >
                    {isActive ? 'จบการสนทนา' : 'เริ่มพูดคุย'}
                </button>
            </div>
        </div>
    );
};

export default LiveSession;