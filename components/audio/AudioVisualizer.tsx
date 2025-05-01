'use client';

import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
}

export default function AudioVisualizer({ isRecording, isPaused }: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (containerRef.current && !wavesurferRef.current) {
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#60a5fa', // blue-400
        progressColor: '#3b82f6', // blue-500
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 80,
        normalize: true,
        backend: 'MediaElement',
      });

      wavesurferRef.current = wavesurfer;
      
      wavesurfer.on('ready', () => {
        setIsReady(true);
      });

      // Create a mock audio for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      return () => {
        wavesurfer.destroy();
        wavesurferRef.current = null;
      };
    }
  }, []);

  // Handle recording state changes
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      if (isRecording && !isPaused) {
        // In a real implementation, this would connect to the microphone stream
        // For the mockup, we'll simulate activity
        const mockActivity = () => {
          if (wavesurferRef.current && isRecording && !isPaused) {
            // Update visualization with random data
            const dataArray = new Uint8Array(128);
            for (let i = 0; i < dataArray.length; i++) {
              dataArray[i] = Math.random() * 128;
            }
            
            // Request next frame if still recording
            requestAnimationFrame(mockActivity);
          }
        };
        
        mockActivity();
      }
    }
  }, [isRecording, isPaused, isReady]);

  return (
    <div className="h-24 bg-slate-800 rounded-lg overflow-hidden">
      {isRecording && !isPaused ? (
        <div ref={containerRef} className="h-full w-full">
          {/* WaveSurfer will render here */}
          {/* Fallback visualization for mockup */}
          <div className="h-full w-full flex items-center justify-center">
            <div className="flex items-center space-x-1">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-blue-400"
                  style={{
                    height: `${Math.random() * 80 + 20}%`,
                    animationDelay: `${i * 0.05}s`,
                    animation: 'pulse 0.5s infinite'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-slate-500">
          {isPaused ? "Recording paused" : "Ready to record"}
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.7); }
        }
      `}</style>
    </div>
  );
}
