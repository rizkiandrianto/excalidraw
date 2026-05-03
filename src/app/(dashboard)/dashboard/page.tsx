"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Canvas } from "@/db/schema";

function CanvasCard({ canvas, onDelete }: { canvas: Canvas; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await fetch(`/api/canvases/${canvas.id}`, { method: "DELETE" });
    onDelete(canvas.id);
  }

  const updatedAt = new Date(canvas.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      onClick={() => router.push(`/canvas/${canvas.id}`)}
      className="group relative bg-white border border-neutral-200 rounded-xl overflow-hidden cursor-pointer hover:border-neutral-400 hover:shadow-md transition-all"
    >
      <div className="h-36 bg-neutral-50 flex items-center justify-center">
        {canvas.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={canvas.thumbnail} alt={canvas.title} className="w-full h-full object-cover" />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 8h10M7 12h6" />
          </svg>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-neutral-900 text-sm truncate">{canvas.title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{updatedAt}</p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 bg-white rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={deleting ? "#d4d4d4" : "#ef4444"} strokeWidth="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/canvases")
      .then((r) => r.json())
      .then((data) => {
        setCanvases(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [status]);

  async function handleNewCanvas() {
    setCreating(true);
    const res = await fetch("/api/canvases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Canvas" }),
    });
    const canvas = await res.json();
    router.push(`/canvas/${canvas.id}`);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <span className="font-semibold text-neutral-900">Canvas</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{session?.user?.name || session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition px-3 py-1.5 rounded-lg hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">My Canvases</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{canvases.length} canvas{canvases.length !== 1 ? "es" : ""}</p>
          </div>
          <button
            onClick={handleNewCanvas}
            disabled={creating}
            className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-700 transition disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {creating ? "Creating..." : "New Canvas"}
          </button>
        </div>

        {canvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <p className="text-neutral-600 font-medium">No canvases yet</p>
            <p className="text-neutral-400 text-sm mt-1">Create your first canvas to get started</p>
            <button
              onClick={handleNewCanvas}
              className="mt-6 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-700 transition"
            >
              Create canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {canvases.map((c) => (
              <CanvasCard
                key={c.id}
                canvas={c}
                onDelete={(id) => setCanvases((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
