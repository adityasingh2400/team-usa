import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
