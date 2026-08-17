import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();

  const { data: paper, error } = await admin
    .from("papers")
    .select("id, file_path, status, original_filename")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }
  if (paper.status !== "approved") {
    return NextResponse.json({ error: "This paper isn't available." }, { status: 403 });
  }

  const { data: signed, error: signError } = await admin.storage
    .from("papers")
    .createSignedUrl(paper.file_path, 60);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link." }, { status: 500 });
  }

  // Track the download (best-effort; failures shouldn't block the redirect).
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  await admin.from("paper_downloads").insert({ paper_id: paper.id, user_id: userData.user?.id ?? null });
  await admin.rpc("increment_download_count", { p_paper_id: paper.id });

  return NextResponse.redirect(signed.signedUrl);
}
