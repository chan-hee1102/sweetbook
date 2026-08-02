export type Species = "dog" | "cat";

export type Pet = {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  birth: string | null; // YYYY-MM-DD
  sex: "male" | "female" | null;
  neutered: boolean;
  weightKg: number | null;
  /** 보호자가 적는 자유 메모 (선택). 알레르기·성격·습관 등 */
  traits: string | null;
  /**
   * 썸네일. 업로드한 사진은 data URL로 들어온다.
   * 없으면 이름 첫 글자로 대체한다. (lib/photo.ts)
   */
  photo: string | null;
  /** 무지개다리를 건넌 아이. 추모 앨범 대상이 되고 화면 문구가 과거형으로 바뀐다. */
  passedAt: string | null;
  createdAt: string;
};

export type RecordKind =
  | "daily"
  | "growth"
  | "hospital"
  | "vaccine"
  | "training"
  | "diagnose";

export type PetRecord = {
  id: string;
  petId: string;
  kind: RecordKind;
  title: string;
  note: string;
  weightKg: number | null;
  photo: string | null;
  /** 진단 기록일 때만 채워진다. 건강수첩에 신호등을 그대로 옮기기 위한 값. */
  triage: TriageLevel | null;
  recordedAt: string; // YYYY-MM-DD
  createdAt: string;
};

export type TriageLevel = "watch" | "soon" | "emergency";

/**
 * 만들 수 있는 것 6종.
 *   책  — 기록을 여러 건 엮는다 (성장 스토리북 · 건강수첩 · 추모 앨범)
 *   굿즈 — 사진 한 장(또는 열두 장)으로 만든다 (액자 · 포토달력 · 퍼즐)
 * 파이프라인은 하나이고, 프리셋이 '몇 장을 어떻게 쓰는지'만 정한다.
 */
export type BookType =
  | "growth"
  | "health"
  | "memorial"
  | "frame"
  | "calendar"
  | "puzzle";

/**
 * 주문 상태. 단방향 전이만 허용한다.
 *
 *   pending -> processing -> shipped -> delivered
 *
 * 과제가 예시로 든 것은 pending → processing → completed '등'이라 단계 구성은
 * 자유다. 보호자 입장에서는 '제작 완료'가 끝이 아니라 물건을 받아야 끝이므로
 * 발송·배송완료까지 넣었다.
 *
 * 단, 배송을 '구현'한 것은 아니다 — 주소를 받지 않고 택배사도 연동하지 않는다.
 * 과제가 요구한 "주문을 기록하고 흐름을 관리하는" 범위 안에서, 운영자가 넘기는
 * 상태를 두 개 더 둔 것뿐이다.
 */
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export type Order = {
  id: string;
  petId: string;
  bookType: BookType;
  title: string;
  periodStart: string;
  periodEnd: string;
  recordIds: string[];
  recordCount: number;
  /** 굿즈 옵션 (액자 재질·퍼즐 조각 수). 책은 null */
  option?: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type Store = {
  pets: Pet[];
  records: PetRecord[];
  orders: Order[];
};
