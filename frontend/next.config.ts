import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move the dev-only build indicator to the bottom-right so it never sits over
  // the landing content in the bottom-left. (Dev only — absent in production.)
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
