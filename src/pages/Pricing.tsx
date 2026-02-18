import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Star } from 'lucide-react';
import type { Translations } from '../i18n';
import type { AnalysisResult } from '../store';
import { useAuth } from '../auth/AuthContext';

interface Props {
  tr: Translations;
  analysis: AnalysisResult | null;
  savePendingSession: (type: 'one_time' | 'subscription') => string;
}

export function Pricing({ tr, analysis, savePendingSession }: Props) {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'one_time' | 'subscription' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!analysis) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 mb-6">{tr.pricing.noAnalysis}</p>
        <Link
          to="/start"
          className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors no-underline"
        >
          {tr.pricing.goAnalyze}
        </Link>
      </div>
    );
  }

  // Already subscribed user
  const isSubscribed = false; // Will check via API if needed; simplified here

  async function handlePayment(type: 'one_time' | 'subscription') {
    if (type === 'subscription' && !user) {
      navigate('/login');
      return;
    }

    setLoading(type);
    setError(null);

    try {
      const pendingSessionKey = savePendingSession(type);
      const successOrigin = window.location.origin + window.location.pathname.replace(/\/$/, '');

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          pendingSessionKey,
          userId: user?.id,
          customerEmail: user?.email || session?.user?.email,
          successOrigin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error || '결제 링크 생성에 실패했습니다.');
        setLoading(null);
        return;
      }

      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{tr.pricing.title}</h1>
        <p className="text-sm text-slate-500">{tr.pricing.subtitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* One-time payment card */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-slate-600" />
            </div>
            <h2 className="font-bold text-slate-900">{tr.pricing.oneTimeTitle}</h2>
          </div>

          <div className="mb-4">
            <span className="text-4xl font-extrabold text-slate-900">{tr.pricing.oneTimePrice}</span>
            <span className="text-sm text-slate-500 ml-1">{tr.pricing.oneTimePeriod}</span>
          </div>

          <p className="text-sm text-slate-500 mb-5">{tr.pricing.oneTimeDesc}</p>

          <ul className="space-y-2 mb-6 flex-1">
            {[tr.pricing.oneTimeFeature1, tr.pricing.oneTimeFeature2, tr.pricing.oneTimeFeature3].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <Check size={14} className="text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePayment('one_time')}
            disabled={loading !== null}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'one_time' ? '처리 중...' : tr.pricing.oneTimeCta}
          </button>
        </div>

        {/* Subscription card */}
        <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 flex flex-col text-white relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Star size={16} className="text-white/60" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Star size={16} className="text-white" />
            </div>
            <h2 className="font-bold">{tr.pricing.subscriptionTitle}</h2>
          </div>

          <div className="mb-4">
            <span className="text-4xl font-extrabold">{tr.pricing.subscriptionPrice}</span>
            <span className="text-sm opacity-80 ml-1">{tr.pricing.subscriptionPeriod}</span>
          </div>

          <p className="text-sm opacity-80 mb-5">{tr.pricing.subscriptionDesc}</p>

          <ul className="space-y-2 mb-6 flex-1">
            {[tr.pricing.subscriptionFeature1, tr.pricing.subscriptionFeature2, tr.pricing.subscriptionFeature3].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/90">
                <Check size={14} className="text-white shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {isSubscribed ? (
            <Link
              to="/report"
              className="w-full bg-white text-primary py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors text-center no-underline block"
            >
              {tr.pricing.subscribedCta}
            </Link>
          ) : (
            <button
              onClick={() => handlePayment('subscription')}
              disabled={loading !== null}
              className="w-full bg-white text-primary py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'subscription'
                ? '처리 중...'
                : !user
                  ? tr.pricing.loginRequired
                  : tr.pricing.subscriptionCta}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Powered by Polar · 안전한 결제
      </p>
    </div>
  );
}
