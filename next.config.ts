import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "1";
const repoBasePath = "/super-eureka";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath: repoBasePath,
        assetPrefix: repoBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_GITHUB_PAGES: isGithubPages ? "1" : "",
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? repoBasePath : "",
  },
};

export default nextConfig;
