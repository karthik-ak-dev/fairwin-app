'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { icon: '🔗', text: 'Requesting random number...' },
  { icon: '⏳', text: 'Chainlink VRF processing...' },
  { icon: '🎯', text: 'Selecting winners...' },
  { icon: '🎉', text: 'Winners found!' },
];

interface DrawingStateProps {
  onComplete?: () => void;
}

export default function DrawingState({ onComplete }: DrawingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= STEPS.length - 1) {
      // Final step reached, call onComplete after a brief delay
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
      {/* Spinning animation */}
      <div className="relative mb-12">
        {/* Outer ring */}
        <div className="w-32 h-32 rounded-full border-4 border-[#00ff88]/20 animate-[spin_3s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00ff88]" />
        </div>
        {/* Inner ring */}
        <div className="absolute inset-3 rounded-full border-4 border-[#FFD700]/20 animate-[spin_2s_linear_infinite_reverse]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
        </div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-pulse">{STEPS[currentStep].icon}</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Drawing in Progress
      </h2>
      <p className="text-sm text-[#888888] mb-12 text-center">
        Provably fair selection via Chainlink VRF
      </p>

      {/* Steps */}
      <div className="w-full max-w-md space-y-4">
        {STEPS.map((step, index) => {
          const isComplete = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div key={index} className="flex items-center gap-4">
              {/* Circle indicator */}
              <div
                className={`
                  relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                  ${
                    isComplete
                      ? 'border-[#00ff88] bg-[#00ff88]/10'
                      : isActive
                      ? 'border-[#00ff88] bg-[#00ff88]/5 animate-pulse'
                      : 'border-[#333] bg-[#111]'
                  }
                `}
              >
                {isComplete ? (
                  <svg
                    className="w-5 h-5 text-[#00ff88]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm">{step.icon}</span>
                )}
              </div>

              {/* Step text */}
              <span
                className={`
                  text-sm font-medium transition-all duration-500
                  ${
                    isComplete
                      ? 'text-[#00ff88]'
                      : isActive
                      ? 'text-white'
                      : 'text-[#555]'
                  }
                `}
              >
                {step.text}
              </span>

              {/* Connector dot for active */}
              {isActive && (
                <span className="ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#00ff88] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="mt-12 text-center">
        <p className="text-xs text-[#555]">
          This process is fully on-chain and cannot be tampered with.
        </p>
        <p className="text-xs text-[#555] mt-1">
          Verification available on{' '}
          <span className="text-[#00ff88]">Polygonscan</span> after completion.
        </p>
      </div>
    </div>
  );
}
