import { supabase } from './supabase';
import type { CareerInput, AnalysisResult, ReportData } from '../store';

export interface AnalysisHistoryRow {
  id: string;
  user_id: string;
  career_input: CareerInput;
  analysis: AnalysisResult;
  report: ReportData | null;
  created_at: string;
}

export async function saveAnalysisHistory(
  userId: string,
  careerInput: CareerInput,
  analysis: AnalysisResult,
  report: ReportData | null,
) {
  const { error } = await supabase.from('analysis_history').insert({
    user_id: userId,
    career_input: careerInput as unknown as Record<string, unknown>,
    analysis: analysis as unknown as Record<string, unknown>,
    report: report as unknown as Record<string, unknown> | null,
  });
  return { error: error?.message ?? null };
}

export async function fetchAnalysisHistory(userId: string): Promise<{ data: AnalysisHistoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    data: (data as unknown as AnalysisHistoryRow[]) ?? [],
    error: error?.message ?? null,
  };
}

export async function deleteAnalysisHistory(id: string) {
  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', id);
  return { error: error?.message ?? null };
}
