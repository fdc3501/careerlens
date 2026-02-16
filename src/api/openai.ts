import type { CareerInput, AnalysisResult, ReportData } from '../store';

export async function fetchReport(
  careerInput: CareerInput,
  analysis: AnalysisResult,
): Promise<ReportData | null> {
  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ careerInput, analysis }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;

    return data as ReportData;
  } catch {
    return null;
  }
}
