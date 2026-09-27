"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, GripVertical, Plus, RotateCw, X } from "lucide-react";
import { memo, useMemo, useState } from "react";
import type { ImageItem } from "@/hooks/useConverter";
import { formatBytes } from "@/lib/image/validate";
import type { PdfSettings } from "@/lib/pdf/settings";
import { PagePreview } from "./PagePreview";

interface Props {
  items: ImageItem[];
  settings: PdfSettings;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onPreview: (index: number) => void;
  onAdd: () => void;
}

export function ImageList({ items, settings, onReorder, onRemove, onRotate, onPreview, onAdd }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = useMemo(() => items.map((it) => it.id), [items]);
  const nameOf = (id: string | number) => items.find((it) => it.id === id)?.name ?? "image";
  const posOf = (id: string | number) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, page ${posOf(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} is over page ${posOf(over.id)} of ${ids.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} dropped at page ${posOf(over.id)} of ${ids.length}.` : `${nameOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onReorder(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  const activeIndex = activeId ? ids.indexOf(activeId) : -1;
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To reorder, press space or enter to pick up the page, use the arrow keys to move it, then press space or enter again to drop it. Press escape to cancel.",
        },
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" aria-label="Pages in your PDF">
          {items.map((item, index) => (
            <SortableCard
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              settings={settings}
              onRemove={onRemove}
              onRotate={onRotate}
              onPreview={onPreview}
              onMove={onReorder}
            />
          ))}
          <li>
            <button
              type="button"
              onClick={onAdd}
              className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rule-strong text-sm font-medium text-graphite transition-colors hover:border-teal hover:bg-teal-soft/40 hover:text-teal"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 ring-1 ring-rule">
                <Plus className="size-5" aria-hidden />
              </span>
              Add More Images
            </button>
          </li>
        </ol>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
        {activeItem ? (
          <div className="rotate-2 cursor-grabbing rounded-xl bg-surface p-2 shadow-2xl ring-1 ring-rule">
            <PagePreview
              thumbUrl={activeItem.thumbUrl}
              width={activeItem.width}
              height={activeItem.height}
              rotation={activeItem.rotation}
              settings={settings}
              alt=""
              className="aspect-square p-3"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface CardProps {
  item: ImageItem;
  index: number;
  count: number;
  settings: PdfSettings;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onPreview: (index: number) => void;
  onMove: (from: number, to: number) => void;
}

const SortableCard = memo(function SortableCard({ item, index, count, settings, onRemove, onRotate, onPreview, onMove }: CardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const loading = item.status !== "ready";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative flex flex-col rounded-xl bg-surface ring-1 ring-rule transition-shadow hover:ring-rule-strong ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onPreview(index)}
        disabled={loading}
        className="block rounded-t-xl bg-surface-2 p-3 focus-visible:outline-offset-[-2px] disabled:cursor-wait"
        aria-label={`Preview ${item.name}`}
      >
        <PagePreview
          thumbUrl={item.thumbUrl}
          width={item.width}
          height={item.height}
          rotation={item.rotation}
          settings={settings}
          alt=""
          className="aspect-square"
        />
      </button>

      {/* Card actions — always visible on touch screens, on hover/focus elsewhere */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
        <IconButton label={`Rotate ${item.name}`} onClick={() => onRotate(item.id)} disabled={loading}>
          <RotateCw className="size-4" aria-hidden />
        </IconButton>
        <IconButton label={`Remove ${item.name}`} onClick={() => onRemove(item.id)} tone="danger">
          <X className="size-4" aria-hidden />
        </IconButton>
      </div>

      <div className="flex items-start gap-1 border-t border-rule px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink" title={item.name}>
            {item.name}
          </p>
          <p className="tabular mt-0.5 flex flex-wrap gap-x-2 text-xs text-graphite">
            <span>{formatBytes(item.size)}</span>
            {loading ? <span>Reading…</span> : <span>{`${item.width} × ${item.height}`}</span>}
          </p>
        </div>
        <span className="tabular mt-px rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-graphite ring-1 ring-rule">
          <span className="sr-only">Page </span>
          {index + 1}
        </span>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.name}, page ${index + 1} of ${count}`}
          className="-mr-1.5 flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-graphite hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      </div>

      {/* Button-based alternative to dragging for keyboard and screen-reader users */}
      <div className="sr-only-focusable absolute bottom-14 left-2 flex gap-1">
        <IconButton label={`Move ${item.name} earlier`} onClick={() => onMove(index, index - 1)} disabled={index === 0}>
          <ChevronLeft className="size-4" aria-hidden />
        </IconButton>
        <IconButton label={`Move ${item.name} later`} onClick={() => onMove(index, index + 1)} disabled={index === count - 1}>
          <ChevronRight className="size-4" aria-hidden />
        </IconButton>
      </div>
    </li>
  );
});

function IconButton({
  label,
  onClick,
  children,
  disabled,
  tone,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label.split(" ")[0]}
      className={`flex size-8 items-center justify-center rounded-lg bg-surface/95 text-graphite shadow-sm ring-1 ring-rule backdrop-blur transition-colors disabled:opacity-40 ${
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
