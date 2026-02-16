import type { CareerInput } from '../store';

interface GitHubSearchResult {
  total_count: number;
  items: { stargazers_count: number }[];
}

async function searchGitHub(query: string): Promise<GitHubSearchResult> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

/** Log-scale normalization: maps a count to 0–100 */
function normalize(count: number): number {
  if (count <= 0) return 0;
  // log10(1) = 0, log10(1_000_000) ≈ 6
  const score = (Math.log10(count) / 6) * 100;
  return Math.round(Math.min(Math.max(score, 0), 100));
}

export interface GitHubSkillData {
  name: string;
  repoCount: number;
  topStars: number;
  marketAvg: number; // normalized 0–100
}

export interface GitHubAnalysisData {
  skills: GitHubSkillData[];
  techTrend: number;
  marketPosition: number;
}

export async function fetchGitHubData(input: CareerInput): Promise<GitHubAnalysisData> {
  const skillList = input.skills.split(',').map(s => s.trim()).filter(Boolean);

  // Fetch all skills in parallel
  const skillResults = await Promise.all(
    skillList.map(async (name): Promise<GitHubSkillData> => {
      const result = await searchGitHub(name);
      const topStars = result.items[0]?.stargazers_count ?? 0;
      return {
        name,
        repoCount: result.total_count,
        topStars,
        marketAvg: normalize(result.total_count),
      };
    }),
  );

  // Fetch job title for marketPosition
  const jobResult = await searchGitHub(input.jobTitle);
  const marketPosition = normalize(jobResult.total_count);

  // techTrend = average marketAvg across skills
  const techTrend =
    skillResults.length > 0
      ? Math.round(skillResults.reduce((sum, s) => sum + s.marketAvg, 0) / skillResults.length)
      : 50;

  return { skills: skillResults, techTrend, marketPosition };
}
