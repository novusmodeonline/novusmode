export default function robots() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: isProd ? [] : ["/"], // block everything on staging
      },
    ],
    sitemap: isProd ? "https://www.novusmode.com//sitemap.xml" : undefined,
    host: "https://www.novusmode.com/",
  };
}
