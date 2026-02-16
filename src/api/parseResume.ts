import type { CareerInput } from '../store';

export async function parseResume(text: string): Promise<CareerInput | null> {
  try {
    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.jobTitle || !data.skills) return null;

    return {
      jobTitle: data.jobTitle,
      experience: data.experience || '0',
      skills: data.skills,
      industry: data.industry || '',
      goal: data.goal || '',
    };
  } catch {
    return null;
  }
}
