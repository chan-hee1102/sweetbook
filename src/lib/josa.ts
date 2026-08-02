/**
 * 한국어 조사 처리.
 *
 * 반려동물 이름·품종·책 이름을 문장에 넣는 화면이 많은데, 조사를 하드코딩하면
 * 값에 따라 문장이 깨진다. 실제로 아래 세 가지가 화면에 그대로 나가고 있었다.
 *   - "'다리를 절음'은(는) 병원 권장 단계입니다"  ← 괄호가 그대로 노출
 *   - "노령묘은 증상이 늦게 드러나"              ← 받침 없는데 '은'
 *   - "건강수첩 + 훈련일지을 만들기 시작합니다"    ← 받침 없는데 '을'
 *
 * 한글 음절은 유니코드에서 (초성×21 + 중성)×28 + 종성 순으로 배열되므로,
 * 코드에서 0xAC00을 뺀 나머지를 28로 나눈 값이 0이 아니면 받침이 있다.
 */

type JosaPair =
  | "은는"
  | "이가"
  | "을를"
  | "과와"
  | "으로로"
  | "이에요예요"
  | "이라라";

const PAIRS: Record<JosaPair, [withBatchim: string, withoutBatchim: string]> = {
  은는: ["은", "는"],
  이가: ["이", "가"],
  을를: ["을", "를"],
  과와: ["과", "와"],
  으로로: ["으로", "로"],
  이에요예요: ["이에요", "예요"],
  이라라: ["이라", "라"],
};

/** 마지막 글자에 받침이 있는가. 한글이 아니면 null(판정 불가). */
function hasBatchim(word: string): boolean | null {
  const last = word.trim().slice(-1);
  if (!last) return null;

  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;

  return (code - 0xac00) % 28 !== 0;
}

/**
 * 단어에 맞는 조사를 고른다.
 *
 *   josa("몽이", "은는")   // "는"
 *   josa("밤톨", "은는")   // "은"
 *   josa("건강수첩", "을를") // "을"
 *
 * 한글로 끝나지 않으면(영문·숫자) 받침 있는 쪽을 쓴다. 어느 쪽도 자연스럽지
 * 않지만, 괄호 표기가 그대로 노출되는 것보다는 낫다.
 */
export function josa(word: string, pair: JosaPair): string {
  const [withB, withoutB] = PAIRS[pair];
  const b = hasBatchim(word);
  return b === false ? withoutB : withB;
}

/** 단어와 조사를 붙여서 돌려준다. `${withJosa("몽이", "은는")} 말티즈입니다` */
export function withJosa(word: string, pair: JosaPair): string {
  return `${word}${josa(word, pair)}`;
}

/** 'ㄹ' 받침은 '으로'가 아니라 '로'를 쓴다. (예: 서울로, 연필로) */
export function ro(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const batchim = (code - 0xac00) % 28;
    if (batchim === 0 || batchim === 8) return "로"; // 받침 없음 또는 ㄹ
  }
  return "으로";
}
