import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MarkDodam } from "@/components/icons";
import { TabBar } from "@/components/TabBar";
import { pretendard } from "@/fonts/pretendard";
import "./globals.css";

export const metadata: Metadata = {
  title: "도담 — 지금 병원에 가야 할지 확인하기",
  description:
    "증상을 고르면 공개 수의학 자료를 근거로 응급, 병원 권장, 지켜보기 중 하나로 안내합니다. 저장한 기록으로 성장 스토리북, 건강수첩, 추모 앨범을 만들 수 있습니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 모바일 브라우저 상단바 색. 헤더가 얹히는 앱 배경과 맞춘다.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-body focus:font-bold focus:text-white"
        >
          본문으로 건너뛰기
        </a>

        <div className="mx-auto flex min-h-screen max-w-app flex-col">
          <header className="sticky top-0 z-20 bg-white/95 shadow-header backdrop-blur">
            <div className="flex items-center justify-between px-4 py-2">
              {/* 도담은 아직 아무도 모르는 이름이다. 이름만 두면 어떤 서비스인지
                  전달되지 않으므로 한 줄 설명을 붙인다. '진단'이 아니라 '증상 확인'인
                  이유는 면책 고지가 "수의학적 진단이 아니다"라고 선언하기 때문이다. */}
              <Link href="/" className="tap gap-2 pr-2">
                <MarkDodam size={26} className="text-brand-700" />
                <span className="flex flex-col">
                  <span className="text-[17px] font-extrabold leading-none tracking-tight text-ink-900">
                    도담
                  </span>
                  <span className="mt-1 text-label font-bold leading-none text-ink-500">
                    반려동물 증상 확인
                  </span>
                </span>
              </Link>
              {/* 탭바는 '지금 할 일', 헤더는 '지난 기록'.
                  진단 내역과 주문 내역을 '내역' 하나로 묶어 여기 둔다. */}
              <Link
                href="/history"
                className="tap rounded-control px-3 text-body font-semibold text-ink-600 hover:bg-ink-100"
              >
                내역
              </Link>
            </div>
          </header>

          {/* 하단 탭바 높이(56px)만큼 여백을 둬야 마지막 요소가 가려지지 않는다 */}
          <main id="main" className="flex-1 px-5 pb-24 pt-6">
            {children}
          </main>

          {/* 푸터를 두지 않는다.
              면책 고지는 판정이 실제로 내려지는 증상 확인 결과 화면에 있고,
              모든 화면 하단에 반복하면 정작 읽어야 할 자리에서 힘을 잃는다.
              운영자 화면 진입은 주문 내역 하단으로 옮겼다. */}
        </div>

        <TabBar />
      </body>
    </html>
  );
}
