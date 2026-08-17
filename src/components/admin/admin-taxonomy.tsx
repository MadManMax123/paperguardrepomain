"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Check, X, Pencil, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

type SimpleRow = { id: string; name: string; sort_order?: number };
type SchoolRow = { id: string; name: string; city: string | null; state: string | null; board: string; verified: boolean };

/**
 * Generic add-and-list manager for a slug/name (+ optional sort_order) table:
 * boards, classes, exam_types, subjects.
 */
function SimpleTaxonomyManager({
  table,
  label,
  hasSortOrder,
  initialRows,
}: {
  table: "boards" | "classes" | "exam_types" | "subjects";
  label: string;
  hasSortOrder?: boolean;
  initialRows: SimpleRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function addRow() {
    const trimmedName = name.trim();
    const trimmedId = (idTouched ? id : slugify(trimmedName)).trim();
    if (!trimmedName || !trimmedId) {
      toast.error("Name is required.");
      return;
    }
    if (rows.some((r) => r.id === trimmedId)) {
      toast.error(`"${trimmedId}" already exists.`);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = hasSortOrder
      ? await supabase.from(table).insert({ id: trimmedId, name: trimmedName, sort_order: rows.length } as never)
      : await supabase.from(table).insert({ id: trimmedId, name: trimmedName } as never);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => [...prev, { id: trimmedId, name: trimmedName, sort_order: rows.length }]);
    setName("");
    setId("");
    setIdTouched(false);
    toast.success(`${trimmedName} added.`);
  }

  async function saveRename(rowId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const { error } = await supabase.from(table).update({ name: trimmed }).eq("id", rowId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, name: trimmed } : r)));
    setEditingId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          The identifier (e.g. <code className="font-mono">half-yearly</code>) is generated from the name and
          used everywhere in URLs and filters — it can&apos;t be changed after creation, only the display name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!idTouched) setId(slugify(e.target.value));
              }}
              placeholder={`e.g. ${label === "Subjects" ? "Computer Science" : "Half-Yearly"}`}
            />
          </div>
          <div className="min-w-[9rem]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Identifier</label>
            <Input
              value={id}
              onChange={(e) => {
                setId(slugify(e.target.value));
                setIdTouched(true);
              }}
              className="font-mono text-xs"
              placeholder="auto-generated"
            />
          </div>
          <button
            onClick={addRow}
            disabled={saving || !name.trim()}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />Add
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm"
              >
                {editingId === r.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(r.id)}
                      className="w-28 bg-transparent text-sm focus:outline-none"
                    />
                    <button onClick={() => saveRename(r.id)} aria-label="Save">
                      <Check className="h-3.5 w-3.5 text-seal" />
                    </button>
                    <button onClick={() => setEditingId(null)} aria-label="Cancel">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </>
                ) : (
                  <>
                    <span>{r.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                    <button
                      onClick={() => { setEditingId(r.id); setEditingName(r.name); }}
                      aria-label={`Rename ${r.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SchoolManager({
  initialRows,
  boards,
}: {
  initialRows: SchoolRow[];
  boards: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [board, setBoard] = useState(boards[0]?.id ?? "");
  const [verified, setVerified] = useState(true);
  const [saving, setSaving] = useState(false);

  async function addSchool() {
    const trimmed = name.trim();
    if (!trimmed || !board) {
      toast.error("School name and board are required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const slug = `${slugify(trimmed)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("schools")
      .insert({ slug, name: trimmed, city: city || null, state: state || null, board, verified })
      .select("id, name, city, state, board, verified")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't add school.");
      return;
    }
    setRows((prev) => [...prev, data]);
    setName(""); setCity(""); setState("");
    toast.success(`${trimmed} added.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schools</CardTitle>
        <CardDescription>
          Added here as already <span className="font-medium text-foreground">verified</span> by default —
          this skips the student-facing request queue, since you&apos;re adding it directly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" className="lg:col-span-2" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional)" />
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State (optional)" />
          <Select value={board} onChange={(e) => setBoard(e.target.value)}>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-primary" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            Mark as verified
          </label>
          <button
            onClick={addSchool}
            disabled={saving || !name.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />Add school
          </button>
        </div>

        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5">
                {s.name}
                {s.verified && <BadgeCheck className="h-3.5 w-3.5 text-seal" />}
                {(s.city || s.state) && (
                  <span className="text-xs text-muted-foreground">
                    {[s.city, s.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">{s.board}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminTaxonomy({
  boards,
  classes,
  examTypes,
  subjects,
  schools,
}: {
  boards: SimpleRow[];
  classes: SimpleRow[];
  examTypes: SimpleRow[];
  subjects: SimpleRow[];
  schools: SchoolRow[];
}) {
  return (
    <div className="space-y-6">
      <SchoolManager initialRows={schools} boards={boards} />
      <SimpleTaxonomyManager table="subjects" label="Subjects" initialRows={subjects} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleTaxonomyManager table="classes" label="Classes" hasSortOrder initialRows={classes} />
        <SimpleTaxonomyManager table="exam_types" label="Exam types" hasSortOrder initialRows={examTypes} />
      </div>
      <SimpleTaxonomyManager table="boards" label="Boards" initialRows={boards} />
    </div>
  );
}
