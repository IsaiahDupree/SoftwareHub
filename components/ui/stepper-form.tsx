"use client";

import { useState, ReactNode } from "react";
import { Check } from "lucide-react";

interface Step {
  title: string;
  content: ReactNode;
}

interface StepperFormProps {
  steps: Step[];
  onComplete: () => void;
}

export function StepperForm({ steps, onComplete }: StepperFormProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`ml-2 text-sm ${index === currentStep ? "font-medium" : "text-muted-foreground"}`}
            >
              {step.title}
            </span>
            {index < steps.length - 1 && <div className="flex-1 h-px bg-border mx-4" />}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <div className="min-h-[200px]">{steps[currentStep].content}</div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="px-4 py-2 rounded-md border hover:bg-muted disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={goNext}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {currentStep === steps.length - 1 ? "Complete" : "Next"}
        </button>
      </div>
    </div>
  );
}
