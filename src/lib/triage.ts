import { josa } from "./josa";
import { searchKnowledge, type KnowledgeHit } from "./knowledge";
import type { Pet, Species, TriageLevel } from "./types";

/**
 * 증상 판정 규칙 엔진.
 *
 * 설계 원칙: **판정은 규칙이, 근거는 검색이 한다.**
 * 응급도는 아래 규칙만으로 결정되고, 검색은 그 판정을 뒷받침할 문장을 찾는
 * 데에만 쓴다. 검색 순위가 응급도를 바꾸지 않기 때문에 "왜 빨간불이 떴는지"를
 * 항상 코드 한 곳으로 설명할 수 있다.
 */

export type SymptomGroup = "호흡·의식" | "소화·배변" | "움직임" | "피부·눈·귀" | "그 밖에";

/**
 * 증상은 응급도가 아니라 몸의 부위로 묶는다.
 * 보호자는 "우리 애가 어디가 이상한지"로 찾지 "이게 몇 단계인지"로 찾지 않는다.
 * 또 심각도로 묶어 두면 고르기 전에 답이 먼저 보인다.
 */
export const SYMPTOM_GROUPS: SymptomGroup[] = [
  "호흡·의식",
  "소화·배변",
  "움직임",
  "피부·눈·귀",
  "그 밖에",
];

export type Symptom = {
  id: string;
  label: string;
  level: TriageLevel;
  species: Species | "both";
  group: SymptomGroup;
  /** 검색 질의를 만들 때 쓰는 보조 표현 */
  terms: string;
};

/**
 * 라벨은 문장이 아니라 이름이다.
 *
 * 처음에는 "숨쉬기 힘들어해요"처럼 전부 '~요'로 끝나는 문장으로 썼는데,
 * 19개가 같은 어미로 끝나면 훑을 때 뒷부분이 전부 노이즈가 된다. 급한 사람이
 * 스캔하는 목록이므로 명사구로 끊었다.
 */
export const SYMPTOMS: Symptom[] = [
  // ── 응급 ──
  { id: "breathing", label: "숨쉬기 힘들어함", level: "emergency", species: "both", group: "호흡·의식", terms: "호흡곤란 호흡 힘듦 청색증" },
  { id: "seizure", label: "경련·발작", level: "emergency", species: "both", group: "호흡·의식", terms: "경련 발작 간질" },
  { id: "collapse", label: "쓰러짐·의식 흐려짐", level: "emergency", species: "both", group: "호흡·의식", terms: "허탈 의식저하 쓰러짐" },
  { id: "blood", label: "피 토함·혈변", level: "emergency", species: "both", group: "소화·배변", terms: "토혈 혈변 출혈" },
  { id: "bloat", label: "배가 부풀고 헛구역질", level: "emergency", species: "dog", group: "소화·배변", terms: "위확장염전 고창 헛구역질" },
  { id: "urine-block", label: "소변을 못 봄", level: "emergency", species: "cat", group: "소화·배변", terms: "요도폐색 배뇨곤란 요폐" },
  { id: "toxic", label: "먹으면 안 되는 것을 먹음", level: "emergency", species: "both", group: "그 밖에", terms: "중독 독성 이물섭취" },

  // ── 곧 병원 ──
  { id: "cough", label: "기침이 계속됨", level: "soon", species: "both", group: "호흡·의식", terms: "기침 케널코프 기관허탈" },
  { id: "vomit", label: "구토 반복", level: "soon", species: "both", group: "소화·배변", terms: "구토 반복 구토" },
  { id: "diarrhea", label: "설사 이틀 이상", level: "soon", species: "both", group: "소화·배변", terms: "설사 묽은변 장염" },
  { id: "anorexia", label: "하루 넘게 안 먹음", level: "soon", species: "both", group: "소화·배변", terms: "식욕부진 밥 안먹음" },
  { id: "thirst", label: "물을 부쩍 많이 마심", level: "soon", species: "both", group: "소화·배변", terms: "다음다뇨 음수량 증가 신장" },
  { id: "limp", label: "다리를 절음", level: "soon", species: "both", group: "움직임", terms: "파행 절뚝임 다리 통증 슬개골" },
  { id: "eye", label: "눈 충혈·눈곱", level: "soon", species: "both", group: "피부·눈·귀", terms: "결막염 안구 충혈 눈곱" },
  { id: "ear", label: "귀를 긁음·귀 냄새", level: "soon", species: "both", group: "피부·눈·귀", terms: "외이염 귀 가려움 귀 냄새" },

  // ── 지켜보기 ──
  { id: "sneeze", label: "가끔 재채기", level: "watch", species: "both", group: "호흡·의식", terms: "재채기 콧물" },
  { id: "shedding", label: "털이 평소보다 빠짐", level: "watch", species: "both", group: "피부·눈·귀", terms: "탈모 털빠짐 환모" },
  { id: "scratch", label: "몸을 조금 긁음", level: "watch", species: "both", group: "피부·눈·귀", terms: "가려움 피부 소양감" },
  { id: "lethargy", label: "활동량이 줄어듦", level: "watch", species: "both", group: "그 밖에", terms: "기력저하 무기력" },
];

/** 이 반려동물에게 보여줄 증상만 추린다. (위확장염전은 개, 요도폐색은 고양이) */
export function symptomsFor(species: Species): Symptom[] {
  return SYMPTOMS.filter((s) => s.species === "both" || s.species === species);
}

/** 자유 서술에서 이 표현이 보이면 선택 증상과 무관하게 응급으로 올린다. */
const EMERGENCY_TERMS = [
  "초콜릿", "자일리톨", "양파", "마늘", "포도", "건포도", "마카다미아",
  "살충제", "쥐약", "부동액", "농약", "락스", "니코틴", "카페인",
  "백합", "튤립", "수국", "디퓨저", "아로마",
  "경련", "발작", "쓰러", "기절", "의식",
  "호흡곤란", "숨을 못", "숨이 차", "헐떡", "청색",
  "피를 토", "토혈", "혈변", "각혈",
  "삼켰", "삼킴", "이물", "중독",
];

const LEVEL_ORDER: TriageLevel[] = ["watch", "soon", "emergency"];

/**
 * 보정 규칙에 의한 승격은 '병원 권장'까지만 허용한다.
 *
 * 이 상한이 없으면 나이 보정과 증상 개수 보정이 겹쳐서, 재채기·털빠짐처럼
 * 가벼운 증상만 있는 노령견이 '응급'으로 판정된다. 빨간불은 명시적인 응급
 * 증상이나 중독 표현이 있을 때만 떠야 오경보가 생기지 않는다.
 */
function escalateSoft(level: TriageLevel): TriageLevel {
  const i = LEVEL_ORDER.indexOf(level);
  const capped = Math.min(i + 1, LEVEL_ORDER.indexOf("soon"));
  return LEVEL_ORDER[Math.max(capped, i)];
}

function maxLevel(levels: TriageLevel[]): TriageLevel | null {
  if (levels.length === 0) return null;
  return levels.reduce((a, b) =>
    LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b
  );
}

export function ageInMonths(birth: string | null, at = new Date()): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  return (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth());
}

function isSenior(pet: Pet): boolean {
  const months = ageInMonths(pet.birth);
  if (months === null) return false;
  // 노령 기준은 종에 따라 다르다 (개 7~8세, 고양이 11세 전후).
  return pet.species === "dog" ? months >= 96 : months >= 132;
}

function isInfant(pet: Pet): boolean {
  const months = ageInMonths(pet.birth);
  return months !== null && months < 4;
}

/* ─────────────────────────── 판정 ─────────────────────────── */

export type TriageReason = { rule: string; detail: string };

export type TriageResult = {
  level: TriageLevel;
  headline: string;
  action: string;
  reasons: TriageReason[];
  evidence: KnowledgeHit[];
  matchedSymptoms: Symptom[];
};

export function runTriage(input: {
  pet: Pet;
  symptomIds: string[];
  freeText: string;
}): TriageResult {
  const { pet, symptomIds, freeText } = input;
  const text = freeText.trim();
  const reasons: TriageReason[] = [];

  const matched = SYMPTOMS.filter((s) => symptomIds.includes(s.id));

  let level: TriageLevel = maxLevel(matched.map((s) => s.level)) ?? "watch";
  if (matched.length > 0) {
    const top = matched.find((s) => s.level === level)!;
    reasons.push({
      rule: "선택한 증상",
      detail: `'${top.label}'${josa(top.label, "은는")} ${levelLabel(level)} 단계로 분류하고 있습니다.`,
    });
  }

  // 규칙 1 — 자유 서술의 응급 표현은 선택 증상을 덮어쓴다.
  const hitTerm = EMERGENCY_TERMS.find((t) => text.includes(t));
  if (hitTerm) {
    level = "emergency";
    reasons.push({
      rule: "적어주신 내용",
      detail: `적어주신 내용에 '${hitTerm}'${josa(hitTerm, "이가")} 있어 응급으로 판정했습니다. 즉시 대응이 필요한 상황입니다.`,
    });
  }

  // 아래 보정 규칙은 응급 판정을 만들지 못한다. 응급이 확정된 경우 건너뛴다.
  if (level !== "emergency") {
    // 규칙 2 — 가벼운 증상이라도 여러 개가 겹치면 한 단계 올린다.
    if (matched.length >= 3 && level === "watch") {
      level = escalateSoft(level);
      reasons.push({
        rule: "증상 개수",
        detail: `가벼운 증상이라도 ${matched.length}가지가 함께 나타나면 진료를 권합니다.`,
      });
    }

    // 규칙 3 — 어리거나 나이 든 아이는 같은 증상도 더 빨리 나빠진다.
    if (isInfant(pet) || isSenior(pet)) {
      const before = level;
      level = escalateSoft(level);
      if (level !== before) {
        reasons.push({
          rule: "나이",
          detail: isInfant(pet)
            ? "생후 4개월 미만은 탈수·저혈당이 빠르게 진행돼 한 단계 올렸습니다."
            : `${pet.species === "dog" ? "노령견은" : "노령묘는"} 증상이 늦게 드러나는 경우가 많아 한 단계 올렸습니다.`,
        });
      }
    }

    // 규칙 4 — 증상 선택 없이 서술만 있고 아는 표현이 없으면 안전한 쪽으로.
    if (matched.length === 0 && text.length > 0) {
      const before = level;
      level = escalateSoft(level);
      if (level !== before) {
        reasons.push({
          rule: "확인 못 한 내용",
          detail: "적어주신 내용에서 알아낸 증상이 없어 안전한 쪽으로 안내합니다.",
        });
      }
    }
  }

  const query = [...matched.map((s) => `${s.label} ${s.terms}`), text]
    .join(" ")
    .trim();

  // 품종 소개문(188건)이 증상 검색을 덮어쓰지 않도록 제외한다.
  const evidence = query
    ? searchKnowledge(query, {
        species: pet.species,
        breed: pet.breed,
        excludeTopics: ["breed"],
        topK: 3,
      })
    : [];

  return {
    level,
    headline: HEADLINE[level],
    action: ACTION[level],
    reasons,
    evidence,
    matchedSymptoms: matched,
  };
}

/* ─────────────────────────── 표현 ─────────────────────────── */

/**
 * 판정 문구는 단정형으로 쓴다.
 *
 * "가야 해요", "괜찮아 보여요" 같은 어미는 서비스가 함께 망설이는 소리로 읽힌다.
 * 밤에 응급 여부를 확인하러 온 사람에게는 판정의 무게가 사라지는 쪽이 더 위험하다.
 * 초록불도 판정이므로 똑같이 단정한다.
 */
const HEADLINE: Record<TriageLevel, string> = {
  watch: "집에서 지켜봐도 됩니다",
  soon: "이틀 안에 병원 진료를 받으세요",
  emergency: "지금 즉시 동물병원으로 가세요",
};

const ACTION: Record<TriageLevel, string> = {
  watch:
    "먹는 양과 활동량을 매일 기록하세요. 증상이 늘거나 사흘 넘게 이어지면 다시 확인하세요.",
  soon:
    "1~2일 안에 진료를 예약하세요. 증상이 언제 시작됐고 하루 몇 번인지 적어 가면 수의사가 볼 정보가 늘어납니다.",
  emergency:
    "지금 문 연 동물병원을 찾아 바로 이동하세요. 밤이면 24시 동물병원입니다. 이동 중에 억지로 먹이거나 토하게 하지 마세요. 상태가 더 나빠질 수 있습니다.",
};

export function levelLabel(level: TriageLevel): string {
  return { watch: "지켜보기", soon: "병원 권장", emergency: "응급" }[level];
}

export const DISCLAIMER =
  "이 결과는 공개 수의학 자료를 정리한 참고 정보이며 수의학적 진단이 아닙니다. 도담은 진료를 대체하지 않습니다. 진단과 치료는 동물병원에서 받으세요.";
