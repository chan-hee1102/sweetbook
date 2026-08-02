import fs from "node:fs";
import path from "node:path";

/**
 * 외부 임베딩 API 없이 동작하는 지식 검색.
 *
 * 처음에는 임베딩(768차원) + 코사인 유사도로 만들었으나, 심사자가 API 키 없이
 * `docker compose up`만으로 전 기능을 확인할 수 있어야 한다는 요건 때문에
 * 걷어냈다. 대신 BM25 역색인을 쓴다.
 *
 * 한국어에서 공백 토크나이저만 쓰면 "호흡곤란"과 "호흡이 곤란"이 한 글자도
 * 겹치지 않는다. 형태소 분석기를 넣으면 의존성이 늘어나므로, 한글 구간을
 * 문자 2-gram으로 함께 색인해 이 문제를 해결했다.
 */

export type KnowledgeItem = {
  id: string;
  species: "dog" | "cat" | "both";
  breed: string | null;
  topic: string;
  content: string;
  source_org: string | null;
  source_title: string | null;
  source_url: string | null;
};

export type KnowledgeHit = KnowledgeItem & {
  score: number;
  /**
   * 질의의 핵심어(idf 상위 3개) 중 이 문서가 포함한 개수.
   * 0이면 흔한 표현만 우연히 겹친 것이므로 답변 근거로 쓰지 않는다.
   */
  keyTermHits: number;
  /** 답변에 인용할 근거 문장. 문서 전체가 아니라 질의와 맞닿은 부분만 뽑는다. */
  evidence: string;
};

type Index = {
  items: KnowledgeItem[];
  /** token -> [docIdx, termFreq][] */
  postings: Map<string, [number, number][]>;
  docLen: number[];
  avgDocLen: number;
};

const globalForIndex = globalThis as unknown as { __petnoteIndex?: Index };

/* ───────────────────────── 토크나이저 ───────────────────────── */

export function tokenize(text: string): string[] {
  const out: string[] = [];
  const norm = text.toLowerCase();

  for (const m of norm.matchAll(/[a-z0-9]+/g)) out.push(m[0]);

  for (const m of norm.matchAll(/[가-힣]+/g)) {
    const s = m[0];
    if (s.length === 1) {
      out.push(s);
      continue;
    }
    for (let i = 0; i + 2 <= s.length; i++) out.push(s.slice(i, i + 2));
  }
  return out;
}

/**
 * 의문사·수량 표현. 이 단어들은 어떤 문서에나 흔히 나와서 '무엇을 묻는지'를
 * 가려내지 못한다. 핵심어에서 제외한다.
 */
const QUESTION_HEADS = new Set([
  "얼마", "어떻", "어떤", "언제", "어디", "무엇", "누가", "왜냐",
  "하나", "한가", "인가", "되나", "될까", "할까", "일까", "그냥",
  "가요", "까요", "나요", "해야", "해도", "있나", "없나", "정도",
  "이거", "저거", "그거", "오늘", "지금", "요즘", "우리", "아이",
]);

/**
 * 질의의 핵심어를 뽑는다 — 각 낱말의 앞 두 글자.
 *
 * 한국어는 조사·어미가 붙어 형태가 계속 변하므로("산책은/산책을/산책과")
 * 어두 2글자를 어간 대용으로 쓴다. 이 값은 색인의 2-gram과 그대로 맞물린다.
 *
 * 이 필터가 없으면 "산책은 얼마나 시켜야 하나요"가 '얼마/하나' 같은 조각만
 * 겹쳐서 중독 문서를 근거로 물어온다.
 */
export function keyTermsOf(query: string): Set<string> {
  const keys = new Set<string>();
  const norm = query.toLowerCase();

  for (const m of norm.matchAll(/[가-힣]{2,}/g)) {
    const head = m[0].slice(0, 2);
    if (!QUESTION_HEADS.has(head)) keys.add(head);
  }
  for (const m of norm.matchAll(/[a-z0-9]{2,}/g)) keys.add(m[0]);

  return keys;
}

/* ─────────────────────────── 색인 ─────────────────────────── */

function buildIndex(): Index {
  if (globalForIndex.__petnoteIndex) return globalForIndex.__petnoteIndex;

  const seedPath = path.join(process.cwd(), "seed", "knowledge.json");
  const items = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as KnowledgeItem[];

  const postings = new Map<string, [number, number][]>();
  const docLen: number[] = [];

  items.forEach((item, docIdx) => {
    // 제목도 본문과 함께 색인한다. 질의어가 제목에만 있는 문서가 꽤 있다.
    const tokens = tokenize(`${item.source_title ?? ""} ${item.content}`);
    docLen.push(tokens.length);

    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

    for (const [token, freq] of tf) {
      const list = postings.get(token);
      if (list) list.push([docIdx, freq]);
      else postings.set(token, [[docIdx, freq]]);
    }
  });

  const avgDocLen = docLen.reduce((a, b) => a + b, 0) / (docLen.length || 1);
  const index: Index = { items, postings, docLen, avgDocLen };
  globalForIndex.__petnoteIndex = index;
  return index;
}

/* ─────────────────────────── 검색 ─────────────────────────── */

const K1 = 1.2;
const B = 0.75;

export type SearchOptions = {
  species?: "dog" | "cat";
  breed?: string | null;
  /** 이 토픽만 대상으로 한다. */
  topics?: string[];
  /** 이 토픽은 제외한다. */
  excludeTopics?: string[];
  topK?: number;
};

export function searchKnowledge(
  query: string,
  opts: SearchOptions = {}
): KnowledgeHit[] {
  const { items, postings, docLen, avgDocLen } = buildIndex();
  const topK = opts.topK ?? 5;

  // 종이 다르면 아예 후보에서 뺀다. 고양이에게 개 기준을 인용하면 안 된다.
  const allowed = new Uint8Array(items.length);
  items.forEach((item, i) => {
    if (opts.species && item.species !== "both" && item.species !== opts.species) return;
    if (opts.topics && !opts.topics.includes(item.topic)) return;
    if (opts.excludeTopics && opts.excludeTopics.includes(item.topic)) return;
    allowed[i] = 1;
  });

  const qTokens = Array.from(new Set(tokenize(query)));
  if (qTokens.length === 0) return [];

  const N = items.length;

  const keyTerms = keyTermsOf(query);

  const scored: { token: string; idf: number; list: [number, number][] }[] = [];
  for (const token of qTokens) {
    const list = postings.get(token);
    if (!list) continue;
    const df = list.length;
    // 거의 모든 문서에 나오는 토큰은 변별력이 없으므로 채점에서 제외한다.
    if (df > N * 0.5) continue;
    scored.push({ token, idf: Math.log(1 + (N - df + 0.5) / (df + 0.5)), list });
  }

  const scores = new Map<number, number>();
  const keyHits = new Map<number, number>();

  for (const { token, idf, list } of scored) {
    const isKey = keyTerms.has(token);
    for (const [docIdx, freq] of list) {
      if (!allowed[docIdx]) continue;
      const norm = 1 - B + B * (docLen[docIdx] / avgDocLen);
      const tfPart = (freq * (K1 + 1)) / (freq + K1 * norm);
      scores.set(docIdx, (scores.get(docIdx) ?? 0) + idf * tfPart);
      if (isKey) keyHits.set(docIdx, (keyHits.get(docIdx) ?? 0) + 1);
    }
  }

  const ranked = [...scores.entries()]
    .map(([docIdx, score]) => {
      const item = items[docIdx];
      // 품종 일치는 아주 작게만 가산한다. 이전 버전에서 이 가산점이 커서
      // 증상을 물어도 품종 소개문이 1위로 올라오는 문제가 있었다.
      const boost = opts.breed && item.breed === opts.breed ? score * 0.05 : 0;
      return { item, score: score + boost, keyTermHits: keyHits.get(docIdx) ?? 0 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return ranked.map(({ item, score, keyTermHits }) => ({
    ...item,
    score,
    keyTermHits,
    evidence: pickEvidence(item.content, qTokens),
  }));
}

/* ────────────────────── 근거 문장 추출 ────────────────────── */

function splitSentences(content: string): string[] {
  return content
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^\[|\]$/g, "").trim())
    .filter((s) => s.length >= 10);
}

/** 임의의 문서에서 질의와 맞닿은 문장을 뽑는다. 품종 카드 등에서 재사용한다. */
export function extractEvidence(content: string, query: string): string {
  return pickEvidence(content, Array.from(new Set(tokenize(query))));
}

/** 문서 전체 대신 질의와 가장 많이 겹치는 문장을 뽑아 인용한다. */
function pickEvidence(content: string, qTokens: string[]): string {
  const sentences = splitSentences(content);
  if (sentences.length === 0) return content.slice(0, 160);

  const qSet = new Set(qTokens);
  let best = sentences[0];
  let bestScore = -1;

  for (const s of sentences) {
    const tokens = new Set(tokenize(s));
    let overlap = 0;
    for (const t of tokens) if (qSet.has(t)) overlap += 1;
    // 지나치게 긴 문장이 단순히 토큰이 많아 유리해지지 않도록 길이로 나눈다.
    const score = overlap / Math.sqrt(tokens.size || 1);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }

  return best.length > 220 ? `${best.slice(0, 220)}…` : best;
}

/**
 * 우리 아이 품종의 소개 문서를 직접 꺼낸다.
 *
 * 품종 문서는 188건으로 전체의 절반이라, 검색 랭킹에 맡기면 질의와 우연히
 * 겹치는 '다른 품종' 문서가 먼저 올라온다("미용 주기"에 라사압소가 1위로
 * 나오는 식). 그래서 랭킹과 무관하게 키로 직접 조회한다.
 */
export function getBreedProfile(
  breed: string | null,
  species: "dog" | "cat"
): KnowledgeItem | null {
  if (!breed) return null;
  const { items } = buildIndex();
  return (
    items.find(
      (i) => i.topic === "breed" && i.breed === breed && i.species === species
    ) ?? null
  );
}

/**
 * 이 점수에 못 미치면 '답을 못 찾았다'로 처리한다.
 *
 * 임계값이 없으면 "산책은 얼마나 시켜야 하나요"에 중독 문서를 근거랍시고
 * 내놓는다. 모르는 것은 모른다고 답하는 편이 신뢰를 지킨다.
 */
export const MIN_RELEVANCE = 8;

/* ─────────────────────────── 통계 ─────────────────────────── */

export function knowledgeStats() {
  const { items } = buildIndex();
  const orgs = new Set(items.map((i) => i.source_org).filter(Boolean));
  return {
    total: items.length,
    orgs: orgs.size,
    withUrl: items.filter((i) => i.source_url).length,
  };
}
