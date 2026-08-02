# 도담 — 3단계 빌드
#
#   deps    의존성만 설치 (package.json이 안 바뀌면 캐시가 살아 있다)
#   builder Next 빌드
#   runner  빌드 산출물만 담은 실행 이미지
#
# 베이스는 alpine 대신 slim(Debian)이다. alpine의 musl libc에서 next swc 바이너리가
# 환경에 따라 실패하는 일이 있어, 심사 환경에서의 재현성을 우선했다.

# ── 1. 의존성 ────────────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm install이 아니라 ci — lock 파일 그대로 설치해 매번 같은 결과를 만든다
RUN npm ci

# ── 2. 빌드 ──────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next.config.js의 output: "standalone" 이 실행에 필요한 것만 추려 낸다
RUN npm run build

# ── 3. 실행 ──────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data

# node 이미지에 미리 있는 비루트 계정으로 실행한다
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# 수의학 지식 358건은 이미지에 포함한다 — 외부 호출 없이 검색이 동작해야 한다
COPY --from=builder --chown=node:node /app/seed ./seed

# 반려동물·기록·주문이 저장되는 경로. compose가 여기에 볼륨을 마운트한다.
# 빈 볼륨은 마운트 지점의 소유권을 물려받으므로, 미리 node 소유로 만들어 둔다.
RUN mkdir -p /app/data && chown node:node /app/data
USER node

EXPOSE 3000
CMD ["node", "server.js"]
