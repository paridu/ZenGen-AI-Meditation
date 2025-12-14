import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

interface VisualizerProps {
  analyser: AnalyserNode;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let dataArray: Uint8Array;
      let bufferLength: number;
      let particles: any[] = [];
      let noiseOffset = 0;

      p.setup = () => {
        p.createCanvas(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        p.angleMode(p.DEGREES);
        p.noFill();
      };

      p.draw = () => {
        // Clear background with slight fade for trail effect
        p.background(2, 6, 23, 20); 
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        const volume = p.map(avg, 0, 255, 0, 1);

        p.translate(p.width / 2, p.height / 2);

        // --- Organic Blob ---
        p.strokeWeight(2);
        const rVal = p.map(avg, 0, 255, 20, 45); // Dark teal
        const gVal = p.map(avg, 0, 255, 180, 212); // Bright teal
        const bVal = p.map(avg, 0, 255, 160, 191);
        
        p.stroke(rVal, gVal, bVal, 200);
        p.fill(rVal, gVal, bVal, 30);

        p.beginShape();
        for (let a = 0; a < 360; a += 5) {
            // Get frequency data mapped to angle
            let index = p.floor(p.map(a, 0, 360, 0, bufferLength/1.5));
            let freq = dataArray[index];
            
            // Perlin noise for organic movement
            let xoff = p.map(p.cos(a), -1, 1, 0, 2) + noiseOffset;
            let yoff = p.map(p.sin(a), -1, 1, 0, 2) + noiseOffset;
            let n = p.noise(xoff, yoff);
            
            // Radius depends on audio + noise
            let r = p.map(freq, 0, 255, 80, 180) + (n * 50 * volume);
            
            let x = r * p.cos(a);
            let y = r * p.sin(a);
            
            p.curveVertex(x, y);
        }
        p.endShape(p.CLOSE);

        // --- Outer Rings ---
        p.noFill();
        p.stroke(255, 255, 255, 30 * volume);
        p.strokeWeight(1);
        p.ellipse(0, 0, 250 + (volume * 50));
        
        p.stroke(255, 255, 255, 15 * volume);
        p.ellipse(0, 0, 320 + (volume * 100));

        noiseOffset += 0.01 + (volume * 0.02);
      };

      p.windowResized = () => {
        if(containerRef.current) {
            p.resizeCanvas(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };
    };

    if (sketchRef.current) {
        sketchRef.current.remove();
    }

    sketchRef.current = new p5(sketch, containerRef.current);

    return () => {
      sketchRef.current?.remove();
    };
  }, [analyser]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none mix-blend-screen" />;
};

export default Visualizer;