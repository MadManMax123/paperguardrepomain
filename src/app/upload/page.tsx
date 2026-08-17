import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFilterOptions, getSchoolsForFilter } from "@/lib/data/papers";
import { UploadTabs } from "@/components/upload-tabs";
import { MyUploads } from "@/components/my-uploads";

export const metadata = { title: "Upload a paper" };

export default async function UploadPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/upload");
  }

  const [filterOptions, schools] = await Promise.all([getFilterOptions(), getSchoolsForFilter()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-bold">Upload a paper</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Uploads are reviewed by moderators before they appear publicly.
      </p>

      <UploadTabs filterOptions={filterOptions} schools={schools} />

      <div className="mt-12">
        <h2 className="mb-3 font-display text-lg font-semibold">Your uploads</h2>
        <MyUploads filterOptions={filterOptions} schools={schools} />
      </div>
    </div>
  );
}
