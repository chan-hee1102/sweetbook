import {
  extractEvidence,
  getBreedProfile,
  MIN_RELEVANCE,
  searchKnowledge,
  type KnowledgeHit,
  type KnowledgeItem,
} from "./knowledge";
import type { Pet } from "./types";

/**
 * '궁금한 것' 모드 — 증상이 아니라 정보를 묻는 질문을 다룬다.
 *
 * 보호자가 가장 많이 검색하는 것은 증상만이 아니다. 미용 주기, 중성화 시기,
 * 먹으면 안 되는 것 같은 정보성 질문이 그만큼 많다. 이 질문들에는 신호등이
 * 어울리지 않으므로 별도 경로로 처리한다.
 *
 * 검색 대상 토픽을 질문마다 고정하는 이유: 자유 검색에 맡기면 "산책은 얼마나"
 * 같은 질문에 중독 문서가 1위로 올라온다. 흔한 표현("얼마나")이 엉뚱한 문서와
 * 겹치기 때문이다.
 */

export type QuickQuestion = {
  id: string;
  /** 버튼에 보이는 짧은 문구 */
  label: string;
  /** 결과 화면에 보이는 질문 문장 */
  display: string;
  /** 검색에 쓰는 확장 질의 */
  terms: string;
  topics: string[];
  /** 우리 아이 품종 카드를 함께 보여줄지 */
  withBreed: boolean;
};

export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "grooming",
    label: "미용 주기",
    display: "미용은 얼마나 자주 해야 하나요?",
    terms: "미용 그루밍 빗질 목욕 털 관리 클리핑 언더코트 엉킴",
    topics: ["grooming", "breed", "dental"],
    withBreed: true,
  },
  {
    id: "toxic",
    label: "먹으면 안 되는 것",
    display: "먹으면 안 되는 음식이 뭔가요?",
    terms: "먹으면 안 되는 음식 독성 중독 초콜릿 양파 포도 자일리톨 백합",
    topics: ["toxic"],
    withBreed: false,
  },
  {
    id: "vaccine",
    label: "예방접종 일정",
    display: "예방접종은 언제 맞아야 하나요?",
    terms: "예방접종 백신 접종 일정 차수 재접종 광견병 종합백신",
    topics: ["vaccine"],
    withBreed: false,
  },
  {
    id: "neuter",
    label: "중성화 시기",
    display: "중성화는 언제 하는 게 좋나요?",
    terms: "중성화 시기 수술 자궁축농증 유선종양 번식",
    topics: ["neuter", "breed_disease", "senior"],
    withBreed: false,
  },
  {
    id: "parasite",
    label: "구충·심장사상충",
    display: "구충제는 얼마나 자주 먹여야 하나요?",
    terms: "구충 심장사상충 외부기생충 벼룩 진드기 예방약 투약 주기",
    topics: ["parasite"],
    withBreed: false,
  },
  {
    id: "breed",
    label: "품종별 주의사항",
    display: "이 품종에서 조심할 점은 무엇인가요?",
    terms: "품종 특징 호발 질환 주의 관리",
    topics: ["breed", "breed_disease"],
    withBreed: true,
  },
];

export type BreedNote = {
  item: KnowledgeItem;
  evidence: string;
};

export type AskResult = {
  question: string;
  /** 질문에 답할 만한 근거를 찾았는지. false면 화면에서 솔직하게 안내한다. */
  answered: boolean;
  breedNote: BreedNote | null;
  /**
   * 등록된 품종이 지식 베이스에 없을 때 그 이름.
   *
   * 품종 카드가 그냥 안 뜨면 사용자는 "왜 안 나오지"를 스스로 추측해야 한다.
   * 없으면 없다고 말하는 편이, 있는 척하거나 침묵하는 것보다 낫다.
   */
  breedMissing: string | null;
  hits: KnowledgeHit[];
};

export function askQuestion(input: {
  pet: Pet;
  /** 프리셋 버튼을 눌렀다면 그 id */
  quickId?: string | null;
  /** 직접 입력한 질문 */
  freeText?: string;
}): AskResult {
  const { pet } = input;
  const quick = QUICK_QUESTIONS.find((q) => q.id === input.quickId) ?? null;
  const free = (input.freeText ?? "").trim();

  const question = quick ? quick.display : free;
  const terms = quick ? `${quick.display} ${quick.terms}` : free;

  if (!terms) {
    return {
      question: "",
      answered: false,
      breedNote: null,
      breedMissing: null,
      hits: [],
    };
  }

  const hits = searchKnowledge(terms, {
    species: pet.species,
    breed: pet.breed,
    // 프리셋은 토픽을 고정한다. 자유 입력은 품종 소개문만 빼고 전체를 본다.
    topics: quick ? quick.topics : undefined,
    excludeTopics: quick ? undefined : ["breed"],
    topK: 4,
  }).filter((h) => h.topic !== "breed"); // 품종 내용은 아래 전용 카드로 따로 보여준다

  // 우리 아이 품종 문서는 랭킹에 맡기지 않고 직접 꺼낸다.
  const profile = quick?.withBreed || !quick
    ? getBreedProfile(pet.breed, pet.species)
    : null;

  const breedNote: BreedNote | null = profile
    ? { item: profile, evidence: extractEvidence(profile.content, terms) }
    : null;

  // 품종을 적어 뒀는데 그 품종 자료가 없는 경우에만 알린다.
  // 품종을 아예 안 적은 사람에게 "자료가 없다"고 말하는 건 엉뚱한 안내다.
  const wantedBreed = quick?.withBreed || !quick;
  const breedMissing = wantedBreed && pet.breed && !profile ? pet.breed : null;

  // 자유 입력은 두 조건을 모두 넘어야 답변으로 인정한다.
  //  - 점수 문턱: 우연한 약한 매칭 배제
  //  - 핵심어 매칭: "산책은 얼마나"가 '얼마나'만 겹쳐 중독 문서를 물어오는 것 방지
  const strong = hits.filter(
    (h) => h.score >= MIN_RELEVANCE && h.keyTermHits > 0
  );

  return {
    question,
    breedMissing,
    // 프리셋은 토픽을 고정했으니 결과가 있으면 신뢰한다.
    // 자유 입력은 점수 문턱을 넘어야 답변으로 인정한다.
    answered: quick ? hits.length > 0 || !!breedNote : strong.length > 0,
    breedNote,
    hits: quick ? hits : strong,
  };
}

export const ASK_FALLBACK =
  "가지고 있는 수의학 자료에서 이 질문에 맞는 내용을 찾지 못했습니다. 아래 자주 묻는 질문을 눌러 보세요. 증상이 있는 상황이면 증상 확인 탭에서 다시 물어보세요.";
