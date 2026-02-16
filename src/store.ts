import { useState, useCallback } from 'react';
import type { Lang } from './i18n';
import { fetchGitHubData } from './api/github';
import { fetchStackExchangeData } from './api/stackexchange';
import { fetchNPMData } from './api/npm';
import { fetchPyPIData } from './api/pypi';
import { fetchReport } from './api/openai';

export interface CareerInput {
  jobTitle: string;
  experience: string;
  skills: string;
  industry: string;
  careerPath: string;
  leadershipExperience: string;
  globalExperience: string;
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

export interface ReportData {
  content: string;
  summary: string;
  skillInsights: { name: string; analysis: string }[];
  roadmap: { month3: string[]; month6: string[]; month12: string[] };
}

export const initialInput: CareerInput = {
  jobTitle: '',
  experience: '',
  skills: '',
  industry: '',
  careerPath: '',
  leadershipExperience: '',
  globalExperience: '',
  goal: '',
};

function generateFallbackAnalysis(input: CareerInput): AnalysisResult {
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
    skills.push({ name: 'General', score: baseScore, marketAvg: baseScore + 5 });
  }

  return {
    marketPosition: Math.min(Math.max(baseScore + variance(), 10), 100),
    techTrend: Math.min(Math.max(baseScore + variance(), 10), 100),
    demandLevel: Math.min(Math.max(baseScore + variance(), 10), 100),
    overallScore: baseScore,
    skills,
    sources: ['Fallback (offline)'],
  };
}

/** Safely run an async fetcher; returns null on failure */
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export function useAppState() {
  const [lang, setLang] = useState<Lang>('ko');
  const [careerInput, setCareerInput] = useState<CareerInput>(initialInput);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const generateAnalysis = useCallback(async (input: CareerInput): Promise<AnalysisResult> => {
    const skillList = input.skills.split(',').map(s => s.trim()).filter(Boolean);
    const expYears = parseInt(input.experience) || 0;

    // Fetch all APIs in parallel, each independently fallible
    const [ghData, seData, npmData, pypiData] = await Promise.all([
      safe(() => fetchGitHubData(input)),
      safe(() => fetchStackExchangeData(skillList)),
      safe(() => fetchNPMData(skillList)),
      safe(() => fetchPyPIData(skillList)),
    ]);

    // If GitHub (primary source) failed entirely, use fallback
    if (!ghData) {
      return generateFallbackAnalysis(input);
    }

    const sources: string[] = ['GitHub API'];
    if (seData) sources.push('StackExchange API');
    if (npmData) sources.push('NPM Registry');
    if (pypiData) sources.push('PyPI API');

    const baseScore = Math.min(40 + expYears * 5 + skillList.length * 3, 95);
    const variance = () => Math.floor(Math.random() * 10 - 5);

    // Build per-skill scores by aggregating available sources
    const skills = ghData.skills.map((gh, i) => {
      const score = Math.min(Math.max(baseScore + variance(), 10), 100);

      // marketAvg: weighted average of available API scores
      const scores: number[] = [gh.marketAvg];
      if (seData?.[i]) scores.push(seData[i].demandScore);
      if (npmData?.[i]) scores.push(npmData[i].popularityScore);
      if (pypiData?.[i]) scores.push(pypiData[i].maturityScore);

      const marketAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      return { name: gh.name, score, marketAvg: Math.min(Math.max(marketAvg, 0), 100) };
    });

    if (skills.length === 0) {
      skills.push({ name: 'General', score: baseScore, marketAvg: 50 });
    }

    // demandLevel: use StackExchange average if available, else experience-based
    let demandLevel: number;
    if (seData && seData.length > 0) {
      const avgDemand = Math.round(seData.reduce((s, d) => s + d.demandScore, 0) / seData.length);
      demandLevel = Math.min(Math.max(avgDemand + variance(), 10), 100);
    } else {
      demandLevel = Math.min(Math.max(baseScore + variance(), 10), 100);
    }

    const overallScore = Math.round((ghData.marketPosition + ghData.techTrend + demandLevel) / 3);

    return {
      marketPosition: ghData.marketPosition,
      techTrend: ghData.techTrend,
      demandLevel,
      overallScore,
      skills,
      sources,
    };
  }, []);

  const generateReport = useCallback(async () => {
    if (!analysis || report || reportLoading) return;
    setReportLoading(true);
    try {
      const data = await fetchReport(careerInput, analysis);
      if (data) setReport(data);
    } finally {
      setReportLoading(false);
    }
  }, [careerInput, analysis, report, reportLoading]);

  return {
    lang,
    setLang,
    careerInput,
    setCareerInput,
    analysis,
    setAnalysis,
    generateAnalysis,
    report,
    setReport,
    reportLoading,
    generateReport,
  };
}
