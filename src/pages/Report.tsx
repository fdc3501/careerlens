import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Share2, Download, Mail, Info, Loader2 } from 'lucide-react';
import { ScoreBar } from '../components/ScoreBar';
import type { Translations } from '../i18n';
import type { AnalysisResult, CareerInput, ReportData } from '../store';

interface Props {
  tr: Translations;
  analysis: AnalysisResult | null;
  careerInput: CareerInput;
  report: ReportData | null;
  reportLoading: boolean;
  generateReport: () => Promise<void>;
}

export function Report({ tr, analysis, careerInput, report, reportLoading, generateReport }: Props) {
  if (!analysis) return <Navigate to="/start" replace />;

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const gapSkills = analysis.skills.map(s => ({
    ...s,
    gap: s.marketAvg - s.score,
  }));

  const needsImprovement = gapSkills.filter(s => s.gap >= 20);
  const strategicPivot = gapSkills.filter(s => s.gap >= 40);

  function getOverallLevel() {
    if (analysis!.overallScore >= 70) return { text: 'Strong', color: 'text-strong' };
    if (analysis!.overallScore >= 40) return { text: 'Stable', color: 'text-stable' };
    return { text: 'Weak', color: 'text-weak' };
  }
  const level = getOverallLevel();

  // Static fallback roadmap phases
  const staticPhases = [
    {
      period: tr.report.month3,
      color: 'border-primary',
      bg: 'bg-primary/5',
      items: needsImprovement.length > 0
        ? needsImprovement.map(s => `${s.name}: Gap ${s.gap} - Intensive learning recommended`)
        : ['Current skills are competitive. Focus on deepening expertise.'],
    },
    {
      period: tr.report.month6,
      color: 'border-accent',
      bg: 'bg-accent/5',
      items: strategicPivot.length > 0
        ? strategicPivot.map(s => `${s.name}: Consider strategic transition (Gap ${s.gap})`)
        : ['Build portfolio projects with current tech stack.', 'Contribute to open source projects.'],
    },
    {
      period: tr.report.month12,
      color: 'border-strong',
      bg: 'bg-strong/5',
      items: [
        careerInput.goal ? `Target: ${careerInput.goal}` : 'Set long-term career direction.',
        'Establish thought leadership in core domain.',
        'Mentor junior developers.',
      ],
    },
  ];

  // AI-powered roadmap phases (when report is available)
  const aiPhases = report ? [
    { period: tr.report.month3, color: 'border-primary', bg: 'bg-primary/5', items: report.roadmap.month3 },
    { period: tr.report.month6, color: 'border-accent', bg: 'bg-accent/5', items: report.roadmap.month6 },
    { period: tr.report.month12, color: 'border-strong', bg: 'bg-strong/5', items: report.roadmap.month12 },
  ] : null;

  const roadmapPhases = aiPhases || staticPhases;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{tr.report.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{careerInput.jobTitle} · {careerInput.experience}yr</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Share2 size={14} /> {tr.report.share}
          </button>
          <button className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Download size={14} /> {tr.report.download}
          </button>
          <button className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Mail size={14} /> {tr.report.email}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white mb-6">
        <h2 className="text-lg font-bold mb-4">{tr.report.summary}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-3xl font-extrabold">{analysis.overallScore}</p>
            <p className={`text-sm font-semibold ${level.color}`}>{level.text}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold">{analysis.marketPosition}</p>
            <p className="text-xs text-slate-400">{tr.preview.marketPosition}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold">{analysis.techTrend}</p>
            <p className="text-xs text-slate-400">{tr.preview.techTrend}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold">{analysis.demandLevel}</p>
            <p className="text-xs text-slate-400">{tr.preview.demandLevel}</p>
          </div>
        </div>
        {reportLoading && (
          <div className="flex items-center gap-2 text-slate-300 text-sm mt-2">
            <Loader2 size={16} className="animate-spin" />
            AI 분석 생성 중...
          </div>
        )}
        {report && (
          <p className="text-sm text-slate-300 leading-relaxed mt-2">{report.summary}</p>
        )}
      </section>

      {/* Skill Analysis */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{tr.report.skillAnalysis}</h2>
        {analysis.skills.map((s, i) => (
          <div key={i}>
            <ScoreBar label={s.name} score={s.score} />
            {report?.skillInsights?.find(si => si.name === s.name) && (
              <p className="text-xs text-slate-500 ml-1 -mt-1 mb-3">
                {report.skillInsights.find(si => si.name === s.name)!.analysis}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Gap Analysis */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{tr.report.gapAnalysis}</h2>
        <div className="space-y-3">
          {gapSkills.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm font-medium text-slate-700">{s.name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">You: <strong className="text-slate-900">{s.score}</strong></span>
                <span className="text-slate-500">Market: <strong className="text-slate-900">{s.marketAvg}</strong></span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                  s.gap >= 40 ? 'bg-weak/10 text-weak' : s.gap >= 20 ? 'bg-stable/10 text-stable' : 'bg-strong/10 text-strong'
                }`}>
                  Gap: {s.gap > 0 ? '+' : ''}{s.gap}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Career Development Roadmap */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">{tr.report.roadmap}</h2>
        {reportLoading && !report && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Loader2 size={16} className="animate-spin" />
            AI 로드맵 생성 중...
          </div>
        )}
        <div className="space-y-6">
          {roadmapPhases.map((phase, i) => (
            <div key={i} className={`border-l-4 ${phase.color} ${phase.bg} rounded-r-xl p-4`}>
              <h3 className="font-bold text-sm text-slate-900 mb-2">{phase.period}</h3>
              <ul className="space-y-1">
                {phase.items.map((item, j) => (
                  <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">{tr.report.dataSource}</h2>
        <div className="flex flex-wrap gap-2">
          {analysis.sources.map((s, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{s}</span>
          ))}
          {report && (
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">OpenAI GPT-4o-mini</span>
          )}
        </div>
      </section>

      {/* Data Limitation */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <Info size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">{tr.report.limitation}</p>
          <p className="text-xs text-amber-700 leading-relaxed">{tr.report.limitationText}</p>
        </div>
      </div>
    </div>
  );
}
