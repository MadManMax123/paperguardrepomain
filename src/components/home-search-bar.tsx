"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/papers?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search papers, schools, subjects..."
        className="h-9 border-none bg-transparent shadow-none focus-visible:ring-0"
      />
    </form>
  );
}
