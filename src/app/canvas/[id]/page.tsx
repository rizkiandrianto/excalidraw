"use client";

import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BinaryFiles = any;

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center"><div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" /></div> }
);

export default function CanvasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("Untitled Canvas");
  const [editingTitle, setEditingTitle] = useState(false);
  const [initialData, setInitialData] = useState<{ elements: readonly ExcalidrawElement[]; appState: Partial<AppState>; files: BinaryFiles } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/canvases/${id}`)
      .then((r) => {
        if (!r.ok) { router.push("/dashboard"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setTitle(data.title);
        setInitialData({
          elements: data.data?.elements ?? [],
          appState: data.data?.appState ?? {},
          files: data.data?.files ?? {},
        });
        setLoading(false);
      });
  }, [id, status, router]);

  const save = useCallback(
    async (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      setSaved(false);
      await fetch(`/api/canvases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { elements, appState: { theme: appState.theme }, files } }),
      });
      setSaved(true);
    },
    [id]
  );

  function handleChange(elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(elements, appState, files), 1500);
  }

  async function handleTitleSave(newTitle: string) {
    setEditingTitle(false);
    if (!newTitle.trim()) return;
    setTitle(newTitle.trim());
    await fetch(`/api/canvases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
  }

  if (status === "loading" || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 bg-white border-b border-neutral-200 flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-neutral-400 hover:text-neutral-900 transition flex items-center gap-1.5 text-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="h-4 w-px bg-neutral-200" />

        {editingTitle ? (
          <input
            autoFocus
            defaultValue={title}
            onBlur={(e) => handleTitleSave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave(e.currentTarget.value);
              if (e.key === "Escape") setEditingTitle(false);
            }}
            className="text-sm font-medium text-neutral-900 outline-none border-b border-neutral-400 bg-transparent px-0.5"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition"
          >
            {title}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs transition ${saved ? "text-neutral-400" : "text-amber-500"}`}>
            {saved ? "Saved" : "Saving..."}
          </span>
          <span className="text-xs text-neutral-300">{session?.user?.name || session?.user?.email}</span>
        </div>
      </header>

      <div className="flex-1 relative">
        {initialData && (
          <Excalidraw
            initialData={initialData}
            onChange={handleChange}
            UIOptions={{ canvasActions: { export: false, loadScene: false } }}
          />
        )}
      </div>
    </div>
  );
}
