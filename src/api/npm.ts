/** NPM Registry API — package download counts for JS/TS ecosystem popularity */

interface NPMDownloads {
  downloads: number;
  package: string;
}

async function fetchDownloads(pkg: string): Promise<number> {
  // npm API: last-month download counts
  const url = `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg.toLowerCase())}`;
  const res = await fetch(url);
  if (!res.ok) return 0; // package may not exist on npm
  const data: NPMDownloads = await res.json();
  return data.downloads ?? 0;
}

/** Log-scale normalization: maps downloads to 0–100 (max ~1B/month) */
function normalize(downloads: number): number {
  if (downloads <= 0) return 0;
  const score = (Math.log10(downloads) / 9) * 100; // log10(1_000_000_000) = 9
  return Math.round(Math.min(Math.max(score, 0), 100));
}

export interface NPMSkillData {
  name: string;
  downloads: number;
  popularityScore: number; // normalized 0–100
}

export async function fetchNPMData(skills: string[]): Promise<NPMSkillData[]> {
  const results = await Promise.all(
    skills.map(async (name): Promise<NPMSkillData> => {
      const downloads = await fetchDownloads(name);
      return { name, downloads, popularityScore: normalize(downloads) };
    }),
  );
  return results;
}
