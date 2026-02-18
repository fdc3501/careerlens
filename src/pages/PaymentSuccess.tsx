import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';
import type { Translations } from '../i18n';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Props {
  tr: Translations;
  restoreFromPendingSession: (key: string) => void;
}

type Status = 'loading' | 'success' | 'failed' | 'expired';

export function PaymentSuccess({ tr, restoreFromPendingSession }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  // CRITICAL: Read checkout_id from window.location.search (BEFORE #)
  // Cannot use useSearchParams() here as HashRouter puts params after #
  const checkoutId = new URLSearchParams(window.location.search).get('checkout_id');

  useEffect(() => {
    if (!checkoutId) {
      setStatus('failed');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus('failed');
      return;
    }

    async function pollOrder() {
      attemptRef.current += 1;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status, metadata_pending_session_key, payment_type')
          .eq('polar_checkout_id', checkoutId!)
          .single();

        if (error || !data) {
          // Not found yet - keep polling
          if (attemptRef.current < 10) {
            pollingRef.current = setTimeout(pollOrder, 2000);
          } else {
            setStatus('expired');
          }
          return;
        }

        if (data.status === 'succeeded') {
          // Restore analysis data from pending session
          if (data.metadata_pending_session_key) {
            restoreFromPendingSession(data.metadata_pending_session_key);
            localStorage.removeItem(data.metadata_pending_session_key);
          }

          // Save payment credentials for Report page
          localStorage.setItem('cl_payment_order_id', checkoutId!);
          localStorage.setItem('cl_payment_type', data.payment_type || 'one_time');

          setStatus('success');
          setTimeout(() => navigate('/report'), 2000);
        } else if (data.status === 'failed') {
          setStatus('failed');
        } else {
          // Still pending - keep polling
          if (attemptRef.current < 10) {
            pollingRef.current = setTimeout(pollOrder, 2000);
          } else {
            setStatus('expired');
          }
        }
      } catch {
        if (attemptRef.current < 10) {
          pollingRef.current = setTimeout(pollOrder, 2000);
        } else {
          setStatus('expired');
        }
      }
    }

    pollOrder();

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-10 max-w-sm w-full text-center shadow-sm">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{tr.paymentSuccess.title}</h1>
            <p className="text-sm text-slate-500">{tr.paymentSuccess.loading}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{tr.paymentSuccess.success}</h1>
            <p className="text-sm text-slate-500">{tr.paymentSuccess.successSub}</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{tr.paymentSuccess.failed}</h1>
            <p className="text-sm text-slate-500 mb-6">{tr.paymentSuccess.failedSub}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { attemptRef.current = 0; setStatus('loading'); }}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                {tr.paymentSuccess.retry}
              </button>
              <Link to="/" className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors no-underline">
                {tr.paymentSuccess.goHome}
              </Link>
            </div>
          </>
        )}

        {status === 'expired' && (
          <>
            <Clock size={48} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">{tr.paymentSuccess.expired}</h1>
            <p className="text-sm text-slate-500 mb-6">{tr.paymentSuccess.expiredSub}</p>
            <Link to="/" className="inline-block border border-slate-200 text-slate-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors no-underline">
              {tr.paymentSuccess.goHome}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
