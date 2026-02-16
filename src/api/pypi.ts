/** PyPI API — package metadata for Python ecosystem popularity */

interface PyPIInfo {
  info: {
    name: string;
    summary: string;
  };
  releases: Record<string, unknown[]>;
}

async function fetchPackage(pkg: string): Promise<{ releaseCount: number }> {
  const url = `https://pypi.org/pypi/${encodeURIComponent(pkg.toLowerCase())}/json`;
  const res = await fetch(url);
  if (!res.ok) return { releaseCount: 0 }; // package may not exist on PyPI
  const data: PyPIInfo = await res.json();
  const releaseCount = Object.keys(data.releases ?? {}).length;
  return { releaseCount };
}

/** Log-scale normalization: maps release count to 0–100 (max ~1000 releases) */
function normalize(releaseCount: number): number {
  if (releaseCount <= 0) return 0;
  const score = (Math.log10(releaseCount) / 3) * 100; // log10(1000) = 3
  return Math.round(Math.min(Math.max(score, 0), 100));
}

export interface PyPISkillData {
  name: string;
  releaseCount: number;
  maturityScore: number; // normalized 0–100
}

export async function fetchPyPIData(skills: string[]): Promise<PyPISkillData[]> {
  const results = await Promise.all(
    skills.map(async (name): Promise<PyPISkillData> => {
      const { releaseCount } = await fetchPackage(name);
      return { name, releaseCount, maturityScore: normalize(releaseCount) };
    }),
  );
  return results;
}
