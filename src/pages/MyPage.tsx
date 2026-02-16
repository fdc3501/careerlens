import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogOut, FileText, KeyRound, Trash2 } from 'lucide-react';
import type { Translations } from '../i18n';

interface MyPageProps {
  tr: Translations;
}

export function MyPage({ tr }: MyPageProps) {
  const { user, signOut, updatePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    setPwError(null);
    setPwLoading(true);

    const { error } = await updatePassword(newPassword);
    setPwLoading(false);

    if (error) {
      setPwError(error);
    } else {
      setPwMessage(tr.auth.passwordChanged);
      setNewPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);

    const { error } = await deleteAccount();
    setDeleteLoading(false);

    if (error) {
      setDeleteError(error);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">{tr.auth.mypage}</h1>

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
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

      {/* Change Password */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <KeyRound size={18} />
          {tr.auth.changePassword}
        </h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={tr.auth.newPasswordPlaceholder}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
          />
          {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
          {pwMessage && <p className="text-green-600 text-sm">{pwMessage}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="self-start bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {pwLoading ? '...' : tr.auth.changePassword}
          </button>
        </form>
      </div>

      {/* Analysis History */}
      <h2 className="text-lg font-semibold mb-4">{tr.auth.analysisHistory}</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mb-6">
        <FileText size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{tr.auth.noHistory}</p>
      </div>

      {/* Delete Account */}
      <div className="border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-600">
          <Trash2 size={18} />
          {tr.auth.deleteAccount}
        </h2>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer transition-colors"
          >
            {tr.auth.deleteAccountButton}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">{tr.auth.deleteAccountConfirm}</p>
            {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? '...' : tr.auth.deleteAccountButton}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors border-none cursor-pointer"
              >
                {tr.auth.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
