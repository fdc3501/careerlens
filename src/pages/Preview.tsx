import { Link, Navigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { ScoreBar } from '../components/ScoreBar';
import type { Translations } from '../i18n';
import type { AnalysisResult } from '../store';

interface Props {
  tr: Translations;
  analysis: AnalysisResult | null;
}

export function Preview({ tr, analysis }: Props) {
  if (!analysis) return <Navigate to="/start" replace />;

  function getLabel(score: number) {
    if (score >= 70) return tr.preview.strong;
    if (score >= 40) return tr.preview.stable;
    return tr.preview.weak;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{tr.preview.title}</h1>
        <p className="text-sm text-slate-500">{tr.preview.subtitle}</p>
      </div>

      {/* Overall score card */}
      <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white text-center mb-6 shadow-lg">
        <p className="text-sm opacity-80 mb-1">{tr.preview.overallScore}</p>
        <p className="text-5xl font-extrabold mb-1">{analysis.overallScore}</p>
        <p className="text-sm font-semibold opacity-90">{getLabel(analysis.overallScore)}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: tr.preview.marketPosition, score: analysis.marketPosition },
          { label: tr.preview.techTrend, score: analysis.techTrend },
          { label: tr.preview.demandLevel, score: analysis.demandLevel },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-slate-900">{m.score}</p>
            <p className={`text-xs font-semibold ${
              m.score >= 70 ? 'text-strong' : m.score >= 40 ? 'text-stable' : 'text-weak'
            }`}>
              {getLabel(m.score)}
            </p>
          </div>
        ))}
      </div>

      {/* Skill scores */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        {analysis.skills.map((s, i) => (
          <ScoreBar key={i} label={s.name} score={s.score} />
        ))}
      </div>

      {/* Full report CTA */}
      <div className="bg-white rounded-2xl border-2 border-primary/20 p-6 text-center mb-6">
        <Lock size={24} className="text-primary mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900 mb-2">{tr.preview.fullReportCta}</h3>
        <p className="text-sm text-slate-500 mb-4">{tr.preview.fullReportDesc}</p>
        <Link
          to="/pricing"
          className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors no-underline"
        >
          {tr.preview.fullReportCta}
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <Link to="/start" className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary no-underline">
          <ArrowLeft size={14} />
          {tr.preview.backToInput}
        </Link>
        <p className="text-xs text-slate-400">{tr.preview.disclaimer}</p>
      </div>
    </div>
  );
}
