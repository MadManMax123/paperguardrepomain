import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();

  const [{ data: papers }, { data: schools }] = await Promise.all([
    admin.from("papers").select("id, updated_at").eq("status", "approved").limit(5000),
    admin.from("schools").select("slug").limit(5000),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/papers`, changeFrequency: "hourly", priority: 0.9 },
    ...((papers ?? []).map((p) => ({
      url: `${base}/paper/${p.id}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))),
    ...((schools ?? []).map((s) => ({
      url: `${base}/schools/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }))),
  ];
}
