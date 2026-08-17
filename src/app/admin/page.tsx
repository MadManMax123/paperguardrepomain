import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getFilterOptions, getSchoolsForFilter } from "@/lib/data/papers";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) redirect("/login?next=/admin");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();

    if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
        redirect("/");
    }

    const [
        { count: totalPapers },
        { count: approvedPapers },
        { count: pendingPapers },
        { count: totalUsers },
        { count: totalSchools },
        { count: totalDownloads },
        { count: openReports },
        { count: openHelpRequests },
        { count: openSubjectRequests },
        filterOptions,
        schools,
        { data: fullSchools },
    ] =
        await Promise.all([
            supabase.from("papers").select("id", { count: "exact", head: true }),
            supabase.from("papers").select("id", { count: "exact", head: true }).eq("status", "approved"),
            supabase.from("papers").select("id", { count: "exact", head: true }).eq("status", "pending"),
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("schools").select("id", { count: "exact", head: true }),
            supabase.from("paper_downloads").select("id", { count: "exact", head: true }),
            supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
            supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
            supabase.from("subject_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
            getFilterOptions(),
            getSchoolsForFilter(),
            supabase.from("schools").select("id, name, city, state, board, verified").order("name"),
        ]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="mb-1 font-display text-2xl font-bold">Admin dashboard</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                New to this panel? Check the <span className="font-medium text-foreground">Guide</span> tab below.
            </p>
            <AdminDashboard
                stats={{
                    totalPapers: totalPapers ?? 0,
                    approvedPapers: approvedPapers ?? 0,
                    pendingPapers: pendingPapers ?? 0,
                    totalUsers: totalUsers ?? 0,
                    totalSchools: totalSchools ?? 0,
                    totalDownloads: totalDownloads ?? 0,
                    openReports: openReports ?? 0,
                    openHelpRequests: openHelpRequests ?? 0,
                    openSubjectRequests: openSubjectRequests ?? 0,
                }}
                filterOptions={filterOptions}
                schools={schools}
                fullSchools={fullSchools ?? []}
            />
        </div>
    );
}