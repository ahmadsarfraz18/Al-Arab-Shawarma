import { createFileRoute } from "@tanstack/react-router";

import { getRequestBaseUrl } from "@/lib/site-url";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = getRequestBaseUrl(request);
        const lines = ["User-agent: *", "Allow: /", "", "Disallow: /admin/", "Disallow: /api/"];
        if (base) lines.push("", `Sitemap: ${base}/sitemap.xml`, "");

        return new Response(lines.join("\n"), {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
