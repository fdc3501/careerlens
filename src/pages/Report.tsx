import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Share2, Download, Mail, Info, Loader2, TrendingUp, Target, Cpu, Globe, Users, BarChart3 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Translations } from '../i18n';
import type { AnalysisResult, CareerInput, ReportData } from '../store';
import { useAuth } from '../auth/AuthContext';
import { saveAnalysisHistory } from '../lib/history';

interface Props {
  tr: Translations;
  analysis: AnalysisResult | null;
  careerInput: CareerInput;
  report: ReportData | null;
  reportLoading: boolean;
  generateReport: () => Promise<void>;
}

function SignalGauge({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#eab308' : '#ef4444';
  const bg = pct >= 70 ? 'bg-green-50 border-green-200' : pct >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  const badge = pct >= 70 ? 'Strong' : pct >= 40 ? 'Stable' : 'Weak';
  const badgeColor = pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function Report({ tr, analysis, careerInput, report, reportLoading, generateReport }: Props) {
  if (!analysis) return <Navigate to="/start" replace />;

  const { user } = useAuth();
  const savedRef = useRef(false);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  // Save to history once report is generated
  useEffect(() => {
    if (report && user && !savedRef.current) {
      savedRef.current = true;
      saveAnalysisHistory(user.id, careerInput, analysis, report);
    }
  }, [report, user, careerInput, analysis]);

  function getOverallLevel() {
    if (analysis!.overallScore >= 70) return { text: 'Strong', color: 'text-strong', bg: 'bg-green-500' };
    if (analysis!.overallScore >= 40) return { text: 'Stable', color: 'text-stable', bg: 'bg-yellow-500' };
    return { text: 'Weak', color: 'text-weak', bg: 'bg-red-500' };
  }
  const level = getOverallLevel();

  const expYears = parseInt(careerInput.experience) || 0;
  const leadershipSignal = careerInput.leadershipExperience === 'true'
    ? Math.min(50 + expYears * 2, 95) : Math.min(30 + expYears, 60);
  const globalSignal = careerInput.globalExperience === 'true'
    ? Math.min(55 + expYears, 85) : Math.min(25 + expYears, 50);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{tr.report.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{careerInput.jobTitle} · {careerInput.experience}yr · {careerInput.industry}</p>
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

      {/* Overall Score Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white mb-6">
        <h2 className="text-lg font-bold mb-4">{tr.report.summary}</h2>
        <div className="flex items-center gap-6 mb-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={level.bg.replace('bg-', '').includes('green') ? '#16a34a' : level.bg.includes('yellow') ? '#eab308' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={`${analysis.overallScore * 2.64} 264`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold">{analysis.overallScore}</span>
              <span className={`text-xs font-semibold ${level.color}`}>{level.text}</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{analysis.marketPosition}</p>
              <p className="text-xs text-slate-400">{tr.preview.marketPosition}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analysis.techTrend}</p>
              <p className="text-xs text-slate-400">{tr.preview.techTrend}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{analysis.demandLevel}</p>
              <p className="text-xs text-slate-400">{tr.preview.demandLevel}</p>
            </div>
          </div>
        </div>
        {reportLoading && (
          <div className="flex items-center gap-2 text-slate-300 text-sm mt-2">
            <Loader2 size={16} className="animate-spin" />
            AI 전략 리포트 생성 중...
          </div>
        )}
        {report && (
          <p className="text-sm text-slate-300 leading-relaxed mt-2">{report.summary}</p>
        )}
      </section>

      {/* Signal Dashboard Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <SignalGauge value={analysis.techTrend} label="Industry Growth" icon={TrendingUp} />
        <SignalGauge value={analysis.demandLevel} label="Market Demand" icon={Target} />
        <SignalGauge value={analysis.overallScore} label="Skill Competitiveness" icon={Cpu} />
        <SignalGauge value={analysis.techTrend} label="DX Alignment" icon={BarChart3} />
        <SignalGauge value={leadershipSignal} label="Leadership" icon={Users} />
        <SignalGauge value={globalSignal} label="Global Portability" icon={Globe} />
      </section>

      {/* Skill Gap Visual */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{tr.report.gapAnalysis}</h2>
        <div className="space-y-4">
          {analysis.skills.map((s, i) => {
            const gap = s.marketAvg - s.score;
            const color = gap >= 40 ? '#ef4444' : gap >= 20 ? '#eab308' : '#16a34a';
            const badgeColor = gap >= 40 ? 'bg-red-100 text-red-700' : gap >= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
            const action = gap >= 40 ? '전략 전환' : gap >= 20 ? '개선 필요' : '유지';
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">You <strong className="text-slate-900">{s.score}</strong> / Market <strong className="text-slate-900">{s.marketAvg}</strong></span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                      Gap {gap > 0 ? '+' : ''}{gap} · {action}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute h-full bg-slate-300/50 rounded-full" style={{ width: `${s.marketAvg}%` }} />
                  <div className="absolute h-full rounded-full transition-all duration-500" style={{ width: `${s.score}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          색상 바 = User Score, 반투명 바 = Market Average. Gap ≥ 20 → 개선 필요, Gap ≥ 40 → 전략적 전환 고려
        </p>
      </section>

      {/* Full Strategic Report (Markdown) */}
      {report?.content && (
        <section className="bg-white rounded-2xl border border-slate-100 mb-6 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
            <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Strategic Analysis Report</h2>
          </div>
          <div className="p-6 md:p-8">
            <div className="
              prose prose-slate prose-sm max-w-none
              prose-headings:text-slate-900
              prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b prose-h1:border-slate-200
              prose-h2:text-base prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100
              prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-sm
              prose-li:text-slate-700 prose-li:text-sm prose-li:leading-relaxed
              prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-sm prose-blockquote:text-slate-700
              prose-table:text-xs
              prose-th:bg-slate-800 prose-th:text-white prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-xs
              prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-slate-100 prose-td:text-xs
              prose-tr:even:bg-slate-50
              prose-code:bg-slate-100 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:text-slate-700 prose-code:before:content-[''] prose-code:after:content-['']
              prose-hr:border-slate-200 prose-hr:my-6
              prose-strong:text-slate-900
              prose-a:text-primary prose-a:no-underline
            ">
              <Markdown remarkPlugins={[remarkGfm]}>{report.content}</Markdown>
            </div>
          </div>
        </section>
      )}

      {/* Loading placeholder when no report yet */}
      {reportLoading && !report?.content && (
        <section className="bg-white rounded-2xl p-12 border border-slate-100 mb-6 text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-slate-500">전략 리포트를 생성하고 있습니다...</p>
          <p className="text-xs text-slate-400 mt-1">수치 근거 기반 6개 섹션 분석 중</p>
        </section>
      )}

      {/* Data Sources */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">{tr.report.dataSource}</h2>
        <div className="flex flex-wrap gap-2">
          {analysis.sources.map((s, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {s}
            </span>
          ))}
          {report && (
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              AI Strategic Analysis
            </span>
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
