/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 이미지에 node_modules 전체를 넣지 않기 위해 standalone 빌드를 쓴다.
  output: "standalone",
  reactStrictMode: true,
};

module.exports = nextConfig;
