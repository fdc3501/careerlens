/** StackExchange API — tag-based question/answer counts for demand scoring */

interface SETagResponse {
  items: { count: number; name: string }[];
}

async function fetchTag(tag: string): Promise<{ count: number }> {
  const url = `https://api.stackexchange.com/2.3/tags/${encodeURIComponent(tag)}/info?site=stackoverflow`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`StackExchange API ${res.status}`);
  const data: SETagResponse = await res.json();
  const count = data.items?.[0]?.count ?? 0;
  return { count };
}

/** Log-scale normalization: maps a count to 0–100 (max ~10M questions) */
function normalize(count: number): number {
  if (count <= 0) return 0;
  const score = (Math.log10(count) / 7) * 100; // log10(10_000_000) = 7
  return Math.round(Math.min(Math.max(score, 0), 100));
}

export interface SESkillData {
  name: string;
  questionCount: number;
  demandScore: number; // normalized 0–100
}

export async function fetchStackExchangeData(skills: string[]): Promise<SESkillData[]> {
  const results = await Promise.all(
    skills.map(async (name): Promise<SESkillData> => {
      // StackExchange tags use lowercase, hyphens (e.g. "node.js", "c#")
      const tag = name.toLowerCase().trim();
      const { count } = await fetchTag(tag);
      return { name, questionCount: count, demandScore: normalize(count) };
    }),
  );
  return results;
}
