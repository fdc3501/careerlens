import { useState, useCallback } from 'react';
import type { Lang } from './i18n';

export interface CareerInput {
  jobTitle: string;
  experience: string;
  skills: string;
  industry: string;
  goal: string;
}

export interface AnalysisResult {
  marketPosition: number;
  techTrend: number;
  demandLevel: number;
  overallScore: number;
  skills: { name: string; score: number; marketAvg: number }[];
  sources: string[];
}

const initialInput: CareerInput = {
  jobTitle: '',
  experience: '',
  skills: '',
  industry: '',
  goal: '',
};

export function useAppState() {
  const [lang, setLang] = useState<Lang>('ko');
  const [careerInput, setCareerInput] = useState<CareerInput>(initialInput);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const generateMockAnalysis = useCallback((input: CareerInput): AnalysisResult => {
    const skillList = input.skills.split(',').map(s => s.trim()).filter(Boolean);
    const expYears = parseInt(input.experience) || 0;

    const baseScore = Math.min(40 + expYears * 5 + skillList.length * 3, 95);
    const variance = () => Math.floor(Math.random() * 20 - 10);

    const skills = skillList.map(name => {
      const score = Math.min(Math.max(baseScore + variance(), 10), 100);
      const marketAvg = Math.min(Math.max(score + variance(), 10), 100);
      return { name, score, marketAvg };
    });

    if (skills.length === 0) {
      skills.push(
        { name: 'General', score: baseScore, marketAvg: baseScore + 5 },
      );
    }

    return {
      marketPosition: Math.min(Math.max(baseScore + variance(), 10), 100),
      techTrend: Math.min(Math.max(baseScore + variance(), 10), 100),
      demandLevel: Math.min(Math.max(baseScore + variance(), 10), 100),
      overallScore: baseScore,
      skills,
      sources: ['GitHub API', 'StackExchange API', 'Google Trends', 'NPM Registry', 'PyPI API'],
    };
  }, []);

  return {
    lang,
    setLang,
    careerInput,
    setCareerInput,
    analysis,
    setAnalysis,
    generateMockAnalysis,
  };
}
