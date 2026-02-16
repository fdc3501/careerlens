import { useAuth } from '../auth/AuthContext';
import { LogOut, FileText } from 'lucide-react';
import type { Translations } from '../i18n';

interface MyPageProps {
  tr: Translations;
}

export function MyPage({ tr }: MyPageProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">{tr.auth.mypage}</h1>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
        <p className="text-sm text-slate-500 mb-1">{tr.auth.email}</p>
        <p className="text-slate-800 font-medium">{user?.email}</p>
        <button
          onClick={signOut}
          className="mt-4 flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors"
        >
          <LogOut size={16} />
          {tr.auth.logout}
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">{tr.auth.analysisHistory}</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <FileText size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{tr.auth.noHistory}</p>
      </div>
    </div>
  );
}
