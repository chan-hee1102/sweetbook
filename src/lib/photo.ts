/**
 * 사진 자리.
 *
 * 이전에는 12가지 그라디언트 프리셋 + 이모지 워터마크였다. 그 결과 홈 한 화면에
 * 브랜드 외 색상군이 5개 동시에 떴고, 화면에서 채도가 가장 높은 면이 '사진이 없는
 * 자리'가 됐다. 배경이어야 할 것이 주인공이 된 셈이다.
 *
 * 지금은 단일 톤 하나만 쓴다. 개체 구분은 색이 아니라 이름의 첫 글자가 한다.
 * 타일 10개가 전부 같은 회색이고 글자만 다르면 '목록'으로 읽히지만,
 * 12색이면 '무지개'로 읽힌다.
 *
 * 실제 반려동물 사진은 저작권 문제가 있고, 외부 이미지 호스트를 참조하면
 * 오프라인 동작 요건이 깨지므로 데모에서는 사진을 쓰지 않는다.
 */

/** 사용자가 직접 올린 사진(data URL)인지 구분한다. */
export function isUploadedPhoto(key: string | null | undefined): boolean {
  return typeof key === "string" && key.startsWith("data:");
}

/**
 * 타일에 새길 글자. 이름의 첫 글자 한 자만 쓴다.
 * 이름이 없는 자리(기록 사진 등)는 빈 문자열 — 글자 없이 결만 남는다.
 */
export function initialOf(name: string | null | undefined): string {
  return (name ?? "").trim().charAt(0);
}
