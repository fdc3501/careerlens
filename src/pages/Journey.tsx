import { Link } from 'react-router-dom';
import { PenLine, Upload } from 'lucide-react';
import type { Translations } from '../i18n';

export function Journey({ tr }: { tr: Translations }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{tr.journey.title}</h1>
        <p className="text-sm text-slate-500">{tr.journey.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/input"
          className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-100 hover:border-primary hover:shadow-lg transition-all no-underline group"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <PenLine size={28} className="text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-900 mb-1">{tr.journey.directTitle}</h3>
            <p className="text-sm text-slate-500">{tr.journey.directDesc}</p>
          </div>
        </Link>

        <Link
          to="/upload"
          className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-slate-100 hover:border-accent hover:shadow-lg transition-all no-underline group"
        >
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Upload size={28} className="text-accent" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-900 mb-1">{tr.journey.uploadTitle}</h3>
            <p className="text-sm text-slate-500">{tr.journey.uploadDesc}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
