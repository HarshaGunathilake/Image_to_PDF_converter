"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { readImageMetadata, ImageReadError } from "@/lib/image/metadata";
import { MAX_FILES, resolveMime, validateFile, type ValidationErrorCode } from "@/lib/image/validate";
import { convertToPdf, type ConversionHandle } from "@/lib/pdf/convert";
import type { Rotation } from "@/lib/pdf/layout";
import { DEFAULT_SETTINGS, type PdfSettings } from "@/lib/pdf/settings";
import { ConversionError, type ConvertProgress } from "@/lib/pdf/types";

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  width: number;
  height: number;
  rotation: Rotation;
  thumbUrl: string | null;
  status: "loading" | "ready";
}

export type Phase = "edit" | "converting" | "done";

export interface ConversionResultState {
  blob: Blob;
  pageCount: number;
  createdAt: number;
}

interface State {
  items: ImageItem[];
  settings: PdfSettings;
  phase: Phase;
  progress: (ConvertProgress & { finishing?: boolean }) | null;
  result: ConversionResultState | null;
}

type Action =
  | { type: "add"; items: ImageItem[] }
  | { type: "loaded"; id: string; width: number; height: number; thumbUrl: string }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "reorder"; from: number; to: number }
  | { type: "rotate"; id: string }
  | { type: "sort"; mode: SortMode }
  | { type: "settings"; patch: Partial<PdfSettings> }
  | { type: "start" }
  | { type: "progress"; progress: ConvertProgress }
  | { type: "finishing" }
  | { type: "done"; result: ConversionResultState }
  | { type: "failed" }
  | { type: "edit" };

export type SortMode = "name-asc" | "name-desc" | "reverse";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return { ...state, items: [...state.items, ...action.items] };
    case "loaded":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id
            ? { ...it, width: action.width, height: action.height, thumbUrl: action.thumbUrl, status: "ready" }
            : it,
        ),
      };
    case "remove":
      return { ...state, items: state.items.filter((it) => it.id !== action.id) };
    case "clear":
      return { ...state, items: [], phase: "edit", result: null, progress: null };
    case "reorder": {
      const items = [...state.items];
      const [moved] = items.splice(action.from, 1);
      items.splice(action.to, 0, moved);
      return { ...state, items };
    }
    case "rotate":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id ? { ...it, rotation: (((it.rotation + 90) % 360) as Rotation) } : it,
        ),
      };
    case "sort": {
      const items = [...state.items];
      if (action.mode === "reverse") items.reverse();
      else items.sort((a, b) => collator.compare(a.name, b.name) * (action.mode === "name-asc" ? 1 : -1));
      return { ...state, items };
    }
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "start":
      return { ...state, phase: "converting", progress: { stage: "preparing", done: 0, total: state.items.length } };
    case "progress":
      return { ...state, progress: action.progress };
    case "finishing":
      return { ...state, progress: state.progress ? { ...state.progress, finishing: true } : null };
    case "done":
      return { ...state, phase: "done", progress: null, result: action.result };
    case "failed":
      return { ...state, phase: "edit", progress: null };
    case "edit":
      return { ...state, phase: "edit", result: null };
  }
}

let idSeq = 0;
const newId = () => `img-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

export interface Notice {
  code: ValidationErrorCode | "no-files" | "conversion";
  files?: string[];
}

export function useConverter(onNotice: (notice: Notice) => void, initialSettings?: Partial<PdfSettings>) {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    settings: { ...DEFAULT_SETTINGS, ...initialSettings },
    phase: "edit",
    progress: null,
    result: null,
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Mirror of items for cleanup code that runs outside render.
  const itemsRef = useRef(state.items);
  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);
  const liveIds = useRef(new Set<string>());
  const conversion = useRef<ConversionHandle | null>(null);
  const noticeRef = useRef(onNotice);
  useEffect(() => {
    noticeRef.current = onNotice;
  }, [onNotice]);

  const revoke = (items: ImageItem[]) => {
    items.forEach((it) => {
      liveIds.current.delete(it.id);
      if (it.thumbUrl) URL.revokeObjectURL(it.thumbUrl);
    });
  };

  // Release every thumbnail URL when the converter unmounts.
  useEffect(
    () => () => {
      revoke(itemsRef.current);
      conversion.current?.cancel();
    },
    [],
  );

  const addFiles = useCallback((input: FileList | File[]) => {
    const files = Array.from(input);
    if (files.length === 0) return;

    const rejected = new Map<ValidationErrorCode, string[]>();
    const reject = (code: ValidationErrorCode, name: string) => rejected.set(code, [...(rejected.get(code) ?? []), name]);

    const accepted: ImageItem[] = [];
    let room = MAX_FILES - itemsRef.current.length;
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        reject(error, file.name);
        continue;
      }
      if (room <= 0) {
        reject("too-many", file.name);
        continue;
      }
      room--;
      accepted.push({
        id: newId(),
        file,
        name: file.name || "Pasted image",
        size: file.size,
        mime: resolveMime(file)!,
        width: 0,
        height: 0,
        rotation: 0,
        thumbUrl: null,
        status: "loading",
      });
    }

    rejected.forEach((names, code) => noticeRef.current({ code, files: names }));
    if (accepted.length === 0) return;
    itemsRef.current = [...itemsRef.current, ...accepted];
    dispatch({ type: "add", items: accepted });

    for (const item of accepted) {
      liveIds.current.add(item.id);
      readImageMetadata(item.file).then(
        ({ width, height, thumb }) => {
          if (!liveIds.current.has(item.id)) return; // removed while loading
          dispatch({ type: "loaded", id: item.id, width, height, thumbUrl: URL.createObjectURL(thumb) });
        },
        (err: unknown) => {
          if (!liveIds.current.has(item.id)) return;
          liveIds.current.delete(item.id);
          dispatch({ type: "remove", id: item.id });
          noticeRef.current({
            code: err instanceof ImageReadError && err.code === "too-large" ? "too-large" : "unreadable",
            files: [item.name],
          });
        },
      );
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    revoke(itemsRef.current.filter((it) => it.id === id));
    dispatch({ type: "remove", id });
  }, []);

  const clearAll = useCallback(() => {
    conversion.current?.cancel();
    revoke(itemsRef.current);
    itemsRef.current = [];
    dispatch({ type: "clear" });
  }, []);

  const convert = useCallback(async () => {
    // Guard against double clicks / repeated submits.
    if (conversion.current) return;
    const items = itemsRef.current;
    if (items.length === 0) {
      noticeRef.current({ code: "no-files" });
      return;
    }
    if (items.some((it) => it.status !== "ready")) return;

    dispatch({ type: "start" });
    const handle = convertToPdf(
      items.map((it) => ({
        id: it.id,
        name: it.name,
        file: it.file,
        mime: it.mime,
        width: it.width,
        height: it.height,
        rotation: it.rotation,
      })),
      stateRef.current.settings,
      { title: "Converted images", onProgress: (progress) => dispatch({ type: "progress", progress }) },
    );
    conversion.current = handle;
    try {
      const { blob, pageCount } = await handle.promise;
      dispatch({ type: "finishing" });
      // A beat on "Almost done…" so the hand-off to the result doesn't feel like a flicker.
      await new Promise((r) => setTimeout(r, 250));
      if (conversion.current !== handle) return;
      dispatch({ type: "done", result: { blob, pageCount, createdAt: Date.now() } });
    } catch (err) {
      if (conversion.current !== handle) return;
      dispatch({ type: "failed" });
      if (err instanceof ConversionError) {
        if (err.code === "cancelled") return;
        if (err.code === "too-large" || err.code === "unreadable") {
          noticeRef.current({ code: err.code, files: err.fileName ? [err.fileName] : undefined });
          return;
        }
      }
      noticeRef.current({ code: "conversion" });
    } finally {
      if (conversion.current === handle) conversion.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    const handle = conversion.current;
    conversion.current = null;
    handle?.cancel();
    dispatch({ type: "failed" });
  }, []);

  return {
    state,
    addFiles,
    removeItem,
    clearAll,
    convert,
    cancel,
    reorder: useCallback((from: number, to: number) => dispatch({ type: "reorder", from, to }), []),
    rotate: useCallback((id: string) => dispatch({ type: "rotate", id }), []),
    sort: useCallback((mode: SortMode) => dispatch({ type: "sort", mode }), []),
    updateSettings: useCallback((patch: Partial<PdfSettings>) => dispatch({ type: "settings", patch }), []),
    backToEdit: useCallback(() => dispatch({ type: "edit" }), []),
  };
}
