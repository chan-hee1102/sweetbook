import { initialOf, isUploadedPhoto } from "@/lib/photo";

/**
 * 사진 자리 — '아직 인화되지 않은 인화지'.
 *
 * 색면도 이모지도 아니다. 단일 톤 + 종이 결 + 왼쪽 위 단일 광원 세 층으로
 * 만들고, 구분은 이름 첫 글자가 한다. (globals.css의 .photo-blank)
 */
export function PhotoTile({
  photo,
  name,
  size,
  radius = 8,
  alt = "",
  className = "",
}: {
  photo: string | null | undefined;
  /** 첫 글자를 새길 이름. 없으면 글자 없이 결만 남는다. */
  name?: string | null;
  /** px. 글자 크기가 이 값의 42%로 정해진다. */
  size: number;
  radius?: number;
  alt?: string;
  className?: string;
}) {
  const box = { width: size, height: size, borderRadius: radius };

  if (isUploadedPhoto(photo)) {
    return (
      // 데이터 URL이라 next/image 최적화 대상이 아니다.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo as string}
        alt={alt}
        style={box}
        className={`object-cover ${className}`}
      />
    );
  }

  // alt가 없으면 장식이다. role="img"로 노출하면 스크린리더가 한 화면에서
  // "사진"을 열 번 넘게 읽는다.
  const a11y = alt
    ? ({ role: "img", "aria-label": alt } as const)
    : ({ "aria-hidden": true } as const);

  return (
    <div
      {...a11y}
      className={`photo-blank ${className}`}
      data-initial={initialOf(name)}
      style={{ ...box, "--tile": `${size}px` } as React.CSSProperties}
    />
  );
}
