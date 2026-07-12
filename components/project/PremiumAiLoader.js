"use client";

import { useEffect, useState } from "react";

const DEFAULT_STEPS = [
  "Yapay zeka verileri inceliyor...",
  "İçerik taslakları oluşturuluyor...",
  "Dil ve anlatım kontrolleri yapılıyor...",
  "Son rötuşlar uygulanıyor, lütfen bekleyin..."
];

export default function PremiumAiLoader({ 
  loading, 
  title = "AI İşlem Yapıyor", 
  steps = DEFAULT_STEPS 
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading, steps]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center space-y-6 max-w-md px-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Pulsing and Rotating Spinner */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full border-4 border-sky-500/10 blur-[2px]"></div>
          {/* Spinning active ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 border-r-sky-500/30 animate-spin duration-1000"></div>
          {/* Center icon */}
          <div className="h-10 w-10 text-sky-400 animate-pulse">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a7 7 0 0 0-6.08 10.52L2 22l9.48-3.92A7 7 0 1 0 12 2zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-1 2h2v2h-2V6zm0 4h2v4h-2v-4z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-zinc-100">{title}</h3>
          <div className="h-6 flex items-center justify-center">
            <p className="text-sm font-semibold text-sky-400 animate-pulse transition-all duration-300">
              {steps[currentStep]}
            </p>
          </div>
          <p className="text-xs text-zinc-450 leading-relaxed max-w-xs">
            Bu işlem arka planda yapay zeka tarafından işleniyor. Lütfen tarayıcıyı kapatmayın.
          </p>
        </div>
      </div>
    </div>
  );
}
