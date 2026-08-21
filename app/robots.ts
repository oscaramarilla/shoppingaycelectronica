import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/gestion", "/admin", "/api/"] },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/gestion", "/admin", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
