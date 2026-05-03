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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any;

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
  const [exporting, setExporting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excalidrawAPI = useRef<ExcalidrawAPI>(null);

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

      const hostedFiles: BinaryFiles = {};
      await Promise.all(
        Object.entries(files as Record<string, { dataURL: string; mimeType: string }>).map(async ([fileId, fileData]) => {
          if (fileData.dataURL.startsWith("data:")) {
            await fetch("/api/files", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: fileId, mimeType: fileData.mimeType, dataURL: fileData.dataURL }),
            });
            hostedFiles[fileId] = { ...fileData, dataURL: `/api/files/${fileId}` };
          } else {
            hostedFiles[fileId] = fileData;
          }
        })
      );

      await fetch(`/api/canvases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { elements, appState: { theme: appState.theme }, files: hostedFiles } }),
      });
      setSaved(true);
    },
    [id]
  );

  function handleChange(elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(elements, appState, files), 1500);
  }

  async function handleExport() {
    if (!excalidrawAPI.current) return;
    setExporting(true);

    const elements = excalidrawAPI.current.getSceneElements();
    const appState = excalidrawAPI.current.getAppState();
    const files = excalidrawAPI.current.getFiles() as Record<string, { dataURL: string; mimeType: string; created: number }>;

    const exportFiles: Record<string, unknown> = {};
    await Promise.all(
      Object.entries(files).map(async ([fileId, fileData]) => {
        if (!fileData.dataURL.startsWith("data:")) {
          const res = await fetch(fileData.dataURL);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          exportFiles[fileId] = { ...fileData, dataURL: base64 };
        } else {
          exportFiles[fileId] = fileData;
        }
      })
    );

    const json = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: window.location.origin,
      elements,
      appState: { theme: appState.theme, viewBackgroundColor: appState.viewBackgroundColor },
      files: exportFiles,
    });

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
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
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition disabled:opacity-50 px-2 py-1 rounded hover:bg-neutral-100"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {exporting ? "Exporting..." : "Export"}
          </button>
          <span className="text-xs text-neutral-300">{session?.user?.name || session?.user?.email}</span>
        </div>
      </header>

      <div className="flex-1 relative">
        {initialData && (
          <Excalidraw
            initialData={initialData}
            onChange={handleChange}
            excalidrawAPI={(api) => { excalidrawAPI.current = api; }}
            UIOptions={{ canvasActions: { export: false, loadScene: false } }}
          />
        )}
      </div>
    </div>
  );
}
