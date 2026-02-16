import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Database, Map } from 'lucide-react';
import type { Translations } from '../i18n';

export function Landing({ tr }: { tr: Translations }) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-36 relative">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
              {tr.landing.badge}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight whitespace-pre-line mb-6">
              {tr.landing.title}
            </h1>
            <p className="text-base md:text-lg text-slate-600 whitespace-pre-line mb-8 leading-relaxed">
              {tr.landing.subtitle}
            </p>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-dark transition-colors no-underline shadow-lg shadow-primary/25"
            >
              {tr.landing.cta}
              <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-slate-400 mt-3">{tr.landing.ctaSub}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <BarChart3 size={28} className="text-primary" />, title: tr.landing.feature1Title, desc: tr.landing.feature1Desc },
            { icon: <Database size={28} className="text-primary" />, title: tr.landing.feature2Title, desc: tr.landing.feature2Desc },
            { icon: <Map size={28} className="text-primary" />, title: tr.landing.feature3Title, desc: tr.landing.feature3Desc },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-12">{tr.landing.howTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { num: '1', title: tr.landing.how1, desc: tr.landing.how1Desc },
              { num: '2', title: tr.landing.how2, desc: tr.landing.how2Desc },
              { num: '3', title: tr.landing.how3, desc: tr.landing.how3Desc },
              { num: '4', title: tr.landing.how4, desc: tr.landing.how4Desc },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">
                  {s.num}
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-10">{tr.landing.faqTitle}</h2>
        <div className="space-y-4">
          {[
            { q: tr.landing.faq1Q, a: tr.landing.faq1A },
            { q: tr.landing.faq2Q, a: tr.landing.faq2A },
            { q: tr.landing.faq3Q, a: tr.landing.faq3A },
          ].map((faq, i) => (
            <details key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer font-medium text-slate-900 text-sm hover:bg-slate-50 list-none flex justify-between items-center">
                {faq.q}
                <span className="text-slate-400 group-open:rotate-180 transition-transform text-lg">&#9662;</span>
              </summary>
              <p className="px-6 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {tr.landing.cta}
          </h2>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors no-underline shadow-lg"
          >
            {tr.landing.cta}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
