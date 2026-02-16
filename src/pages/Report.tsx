import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Share2, Download, Mail, Info, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  function getOverallLevel() {
    if (analysis!.overallScore >= 70) return { text: 'Strong', color: 'text-strong' };
    if (analysis!.overallScore >= 40) return { text: 'Stable', color: 'text-stable' };
    return { text: 'Weak', color: 'text-weak' };
  }
  const level = getOverallLevel();

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

      {/* Executive Summary Scores */}
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
            AI 전략 리포트 생성 중...
          </div>
        )}
        {report && (
          <p className="text-sm text-slate-300 leading-relaxed mt-2">{report.summary}</p>
        )}
      </section>

      {/* Full Strategic Report (Markdown) */}
      {report?.content && (
        <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 mb-6">
          <div className="prose prose-slate prose-sm max-w-none
            prose-headings:text-slate-900
            prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-0
            prose-h2:text-lg prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-sm
            prose-li:text-slate-700 prose-li:text-sm
            prose-table:text-sm
            prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-slate-700
            prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-slate-100
            prose-hr:border-slate-200 prose-hr:my-6
            prose-strong:text-slate-900
          ">
            <Markdown remarkPlugins={[remarkGfm]}>{report.content}</Markdown>
          </div>
        </section>
      )}

      {/* Skill Score Bars (fallback / supplementary) */}
      {!report?.content && (
        <>
          <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{tr.report.skillAnalysis}</h2>
            {analysis.skills.map((s, i) => (
              <div key={i}>
                <ScoreBar label={s.name} score={s.score} />
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{tr.report.gapAnalysis}</h2>
            <div className="space-y-3">
              {analysis.skills.map((s, i) => {
                const gap = s.marketAvg - s.score;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">You: <strong className="text-slate-900">{s.score}</strong></span>
                      <span className="text-slate-500">Market: <strong className="text-slate-900">{s.marketAvg}</strong></span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                        gap >= 40 ? 'bg-weak/10 text-weak' : gap >= 20 ? 'bg-stable/10 text-stable' : 'bg-strong/10 text-strong'
                      }`}>
                        Gap: {gap > 0 ? '+' : ''}{gap}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Data Sources */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">{tr.report.dataSource}</h2>
        <div className="flex flex-wrap gap-2">
          {analysis.sources.map((s, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{s}</span>
          ))}
          {report && (
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">AI Strategic Analysis</span>
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
