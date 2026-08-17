"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Inbox, School, Flag, BarChart3, BookOpen, UploadCloud, Tags, LifeBuoy } from "lucide-react";
import { PendingUploads } from "@/components/admin/pending-uploads";
import { SchoolRequests } from "@/components/admin/school-requests";
import { SubjectRequests } from "@/components/admin/subject-requests";
import { ReportsQueue } from "@/components/admin/reports-queue";
import { HelpRequestsQueue } from "@/components/admin/help-requests-queue";
import { AdminGuide } from "@/components/admin/admin-guide";
import { BulkUploadForm } from "@/components/bulk-upload-form";
import { AdminTaxonomy } from "@/components/admin/admin-taxonomy";

type Tab = "pending" | "schools" | "subjects" | "reports" | "help" | "stats" | "add" | "taxonomy" | "guide";

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string; sort_order?: number }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string; sort_order?: number }[];
}
type School = { id: string; name: string; board: string };
type FullSchool = { id: string; name: string; city: string | null; state: string | null; board: string; verified: boolean };

export function AdminDashboard({
  stats,
  filterOptions,
  schools,
  fullSchools,
}: {
  stats: {
    totalPapers: number;
    approvedPapers: number;
    pendingPapers: number;
    totalUsers: number;
    totalSchools: number;
    totalDownloads: number;
    openReports: number;
    openHelpRequests: number;
    openSubjectRequests: number;
  };
  filterOptions: FilterOptions;
  schools: School[];
  fullSchools: FullSchool[];
}) {
  const [tab, setTab] = useState<Tab>("pending");

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "pending", label: "Pending uploads", icon: Inbox, count: stats.pendingPapers },
    { id: "add", label: "Bulk upload", icon: UploadCloud },
    { id: "taxonomy", label: "Taxonomy", icon: Tags },
    { id: "schools", label: "School requests", icon: School },
    { id: "subjects", label: "Subject requests", icon: Tags, count: stats.openSubjectRequests },
    { id: "reports", label: "Reports", icon: Flag, count: stats.openReports },
    { id: "help", label: "Help requests", icon: LifeBuoy, count: stats.openHelpRequests },
    { id: "stats", label: "Statistics", icon: BarChart3 },
    { id: "guide", label: "Guide", icon: BookOpen },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {!!t.count && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-semibold text-highlight-foreground">
                  {t.count}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="admin-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === "pending" && <PendingUploads />}
        {tab === "add" && <BulkUploadForm filterOptions={filterOptions} schools={schools} />}
        {tab === "taxonomy" && (
          <AdminTaxonomy
            boards={filterOptions.boards}
            classes={filterOptions.classes}
            examTypes={filterOptions.examTypes}
            subjects={filterOptions.subjects}
            schools={fullSchools}
          />
        )}
        {tab === "schools" && <SchoolRequests />}
        {tab === "subjects" && <SubjectRequests existingSubjects={filterOptions.subjects} />}
        {tab === "reports" && <ReportsQueue />}
        {tab === "help" && <HelpRequestsQueue />}
        {tab === "stats" && <StatsGrid stats={stats} />}
        {tab === "guide" && <AdminGuide />}
      </motion.div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: Record<string, number> }) {
  const items = [
    { label: "Total papers", value: stats.totalPapers },
    { label: "Approved papers", value: stats.approvedPapers },
    { label: "Pending papers", value: stats.pendingPapers },
    { label: "Users", value: stats.totalUsers },
    { label: "Schools", value: stats.totalSchools },
    { label: "Downloads", value: stats.totalDownloads },
    { label: "Open reports", value: stats.openReports },
    { label: "Open help requests", value: stats.openHelpRequests },
    { label: "Open subject requests", value: stats.openSubjectRequests },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((i, idx) => (
        <motion.div
          key={i.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.04 }}
          className="rounded-lg border border-border p-5"
        >
          <p className="font-display text-2xl font-bold">{(i.value ?? 0).toLocaleString("en-IN")}</p>
          <p className="text-sm text-muted-foreground">{i.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
