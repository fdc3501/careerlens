import type { CareerInput, AnalysisResult, ReportData, PaymentCredential } from '../store';
import { supabase } from '../lib/supabase';

export async function fetchReport(
  careerInput: CareerInput,
  analysis: AnalysisResult,
  credential?: PaymentCredential,
): Promise<ReportData | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // For subscription, attach JWT for server-side verification
    if (credential?.paymentType === 'subscription' && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    const res = await fetch('/api/report', {
      method: 'POST',
      headers,
      body: JSON.stringify({ careerInput, analysis, credential }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;

    return data as ReportData;
  } catch {
    return null;
  }
}
