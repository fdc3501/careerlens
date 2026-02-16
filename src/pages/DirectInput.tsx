import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import type { Translations } from '../i18n';
import type { CareerInput, AnalysisResult, ReportData } from '../store';
import { initialInput } from '../store';

interface Props {
  tr: Translations;
  careerInput: CareerInput;
  setCareerInput: (input: CareerInput) => void;
  generateAnalysis: (input: CareerInput) => Promise<AnalysisResult>;
  setAnalysis: (result: AnalysisResult | null) => void;
  setReport: (report: ReportData | null) => void;
}

type StepKey = 'jobTitle' | 'experience' | 'skills' | 'industry' | 'careerPath' | 'leadershipExperience' | 'globalExperience' | 'goal';

const steps: StepKey[] = ['jobTitle', 'experience', 'skills', 'industry', 'careerPath', 'leadershipExperience', 'globalExperience', 'goal'];

const selectSteps = new Set<StepKey>(['leadershipExperience', 'globalExperience']);

export function DirectInput({ tr, careerInput, setCareerInput, generateAnalysis, setAnalysis, setReport }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Reset all state on mount so resume upload data doesn't leak in
  useEffect(() => {
    setCareerInput({ ...initialInput });
    setAnalysis(null);
    setReport(null);
  }, [setCareerInput, setAnalysis, setReport]);
  const field = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const fieldConfig: Record<StepKey, { label: string; placeholder: string; type: string }> = {
    jobTitle: { label: tr.input.jobTitle, placeholder: tr.input.jobTitlePlaceholder, type: 'text' },
    experience: { label: tr.input.experience, placeholder: tr.input.experiencePlaceholder, type: 'number' },
    skills: { label: tr.input.skills, placeholder: tr.input.skillsPlaceholder, type: 'text' },
    industry: { label: tr.input.industry, placeholder: tr.input.industryPlaceholder, type: 'text' },
    careerPath: { label: tr.input.careerPath, placeholder: tr.input.careerPathPlaceholder, type: 'text' },
    leadershipExperience: { label: tr.input.leadershipExperience, placeholder: tr.input.leadershipExperiencePlaceholder, type: 'select' },
    globalExperience: { label: tr.input.globalExperience, placeholder: tr.input.globalExperiencePlaceholder, type: 'select' },
    goal: { label: tr.input.goal, placeholder: tr.input.goalPlaceholder, type: 'text' },
  };

  const current = fieldConfig[field];
  const isLast = step === steps.length - 1;
  const isSelect = selectSteps.has(field);
  const canProceed = careerInput[field].trim() !== '';

  function handleChange(value: string) {
    setCareerInput({ ...careerInput, [field]: value });
  }

  async function handleNext() {
    if (isLast) {
      setLoading(true);
      try {
        const result = await generateAnalysis(careerInput);
        setAnalysis(result);
        navigate('/preview');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  }

  function handleSelect(value: string) {
    setCareerInput({ ...careerInput, [field]: value });
    // Auto-advance after selection
    setTimeout(() => {
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
    }, 200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canProceed) {
      handleNext();
    }
  }

  const yesLabel = field === 'leadershipExperience' ? tr.input.leadershipYes : tr.input.globalYes;
  const noLabel = field === 'leadershipExperience' ? tr.input.leadershipNo : tr.input.globalNo;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 md:py-24">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{tr.input.progress}</span>
          <span>{step + 1} / {steps.length}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-8">{tr.input.title}</h1>

      {/* Single question per screen */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">{current.label}</label>
        {isSelect ? (
          <div>
            <p className="text-sm text-slate-500 mb-4">{current.placeholder}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSelect('true')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors cursor-pointer ${
                  careerInput[field] === 'true'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-primary/50'
                }`}
              >
                {yesLabel}
              </button>
              <button
                onClick={() => handleSelect('false')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors cursor-pointer ${
                  careerInput[field] === 'false'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-primary/50'
                }`}
              >
                {noLabel}
              </button>
            </div>
          </div>
        ) : (
          <input
            type={current.type}
            value={careerInput[field]}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={current.placeholder}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            autoFocus
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 bg-white cursor-pointer"
          >
            <ArrowLeft size={16} />
            {tr.input.back}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed || loading}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isLast ? (
            <>
              <Search size={16} />
              {tr.input.analyze}
            </>
          ) : (
            <>
              {tr.input.next}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
