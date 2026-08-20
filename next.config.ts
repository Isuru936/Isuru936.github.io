import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Fully static site — there is no server in production. The dormant
   * `src/db` and `src/actions` code is not reachable from any route, so it does
   * not block the export.
   */
  output: "export",

  /** The optimizer needs a server; there is none. We ship plain <img> anyway. */
  images: { unoptimized: true },
};

export default nextConfig;
