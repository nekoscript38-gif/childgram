import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eraser, Paintbrush, Redo2, Save, Send, Trash2, Undo2, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRUSH_SIZES, CANVAS_SIZE, PALETTE } from "@/lib/palette";
import { TITLE_MAX } from "@/lib/rules";
import { cn } from "@/lib/utils";

type Initial = {
  id: string | null;
  title: string;
  image_data: string | null;
  is_published: boolean;
};

const HISTORY_LIMIT = 15;

function exportImage(canvas: HTMLCanvasElement) {
  const webp = canvas.toDataURL("image/webp", 0.9);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function DrawingStudio({ initial }: { initial: Initial }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  const [color, setColor] = useState(PALETTE[5]);
  const [size, setSize] = useState(BRUSH_SIZES[3]);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [title, setTitle] = useState(initial.title);
  const [published, setPublished] = useState(initial.is_published);
  const [saving, setSaving] = useState<null | "save" | "publish" | "unpublish" | "delete">(null);
  const [historyTick, setHistoryTick] = useState(0);

  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctxRef.current = ctx;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (initial.image_data) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      img.src = initial.image_data;
    }
    // Load the saved picture only once: later refetches must not wipe new strokes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapshot = useCallback(() => {
    const ctx = ctxRef.current!;
    undoStack.current.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
    if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
    redoStack.current = [];
    setHistoryTick((t) => t + 1);
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * CANVAS_SIZE) / rect.width,
      y: ((e.clientY - rect.top) * CANVAS_SIZE) / rect.height,
    };
  }

  function strokeStyle() {
    const ctx = ctxRef.current!;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    snapshot();
    drawing.current = true;
    const p = point(e);
    last.current = p;
    strokeStyle();
    const ctx = ctxRef.current!;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = ctxRef.current!;
    const events = (e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]) as PointerEvent[];
    const rect = e.currentTarget.getBoundingClientRect();
    strokeStyle();
    for (const ev of events) {
      const p = {
        x: ((ev.clientX - rect.left) * CANVAS_SIZE) / rect.width,
        y: ((ev.clientY - rect.top) * CANVAS_SIZE) / rect.height,
      };
      const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
    }
  }

  function onUp() {
    drawing.current = false;
    last.current = null;
  }

  function undo() {
    const ctx = ctxRef.current!;
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
    ctx.putImageData(prev, 0, 0);
    setHistoryTick((t) => t + 1);
  }

  function redo() {
    const ctx = ctxRef.current!;
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
    ctx.putImageData(next, 0, 0);
    setHistoryTick((t) => t + 1);
  }

  function clearAll() {
    if (!window.confirm("Tout effacer ? Tu pourras annuler juste après.")) return;
    snapshot();
    const ctx = ctxRef.current!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  async function persist(kind: "save" | "publish" | "unpublish") {
    setSaving(kind);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Tu n'es plus connecté");
      const image_data = exportImage(canvasRef.current!);
      const is_published = kind === "publish" ? true : kind === "unpublish" ? false : published;
      const payload = { title: title.trim().slice(0, TITLE_MAX), image_data, is_published };
      let id = initial.id;
      if (id) {
        const { error } = await supabase.from("drawings").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("drawings")
          .insert({ ...payload, user_id: u.user.id })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      }
      setPublished(is_published);
      qc.invalidateQueries({ queryKey: ["my-drawings"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["drawing", id] });
      qc.invalidateQueries({ queryKey: ["edit-drawing", id] });
      if (kind === "publish") {
        toast.success("Ton dessin est publié ! 🎉");
        navigate({ to: "/dessin/$drawingId", params: { drawingId: id! } });
      } else {
        toast.success(kind === "unpublish" ? "Ton dessin est redevenu un brouillon" : "Dessin sauvegardé !");
        if (!initial.id) navigate({ to: "/studio/$drawingId", params: { drawingId: id! }, replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Oups, la sauvegarde a échoué");
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!initial.id) return;
    if (!window.confirm("Supprimer ce dessin pour toujours ?")) return;
    setSaving("delete");
    const { error } = await supabase.from("drawings").delete().eq("id", initial.id);
    setSaving(null);
    if (error) return toast.error("Impossible de supprimer ce dessin");
    qc.invalidateQueries({ queryKey: ["my-drawings"] });
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Dessin supprimé");
    navigate({ to: "/studio" });
  }

  const isCustomColor = !PALETTE.includes(color);
  void historyTick;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Donne un titre à ton dessin"
            className="h-12 flex-1 font-display text-lg"
            aria-label="Titre du dessin"
          />
          <span
            className={cn(
              "rounded-full border-[2.5px] border-ink px-3 py-1 font-display text-sm font-bold",
              published ? "bg-accent" : "bg-muted",
            )}
          >
            {published ? "Publié" : "Brouillon"}
          </span>
        </div>

        <div className="sticker-lg overflow-hidden p-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onUp}
            className={cn(
              "block aspect-square w-full touch-none rounded-xl bg-paper",
              tool === "eraser" ? "cursor-cell" : "cursor-crosshair",
            )}
            aria-label="Zone de dessin"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.current.length === 0}>
            <Undo2 /> Annuler
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.current.length === 0}>
            <Redo2 /> Refaire
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Sparkles /> Tout effacer
          </Button>
          {initial.id && (
            <Button variant="destructive" size="sm" onClick={remove} disabled={!!saving} className="ml-auto">
              <Trash2 /> Supprimer
            </Button>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="sticker space-y-3 p-4">
          <p className="font-display text-lg font-bold">Outil</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={tool === "brush" ? "sun" : "outline"} size="sm" onClick={() => setTool("brush")} aria-pressed={tool === "brush"}>
              <Paintbrush /> Pinceau
            </Button>
            <Button variant={tool === "eraser" ? "sun" : "outline"} size="sm" onClick={() => setTool("eraser")} aria-pressed={tool === "eraser"}>
              <Eraser /> Gomme
            </Button>
          </div>
        </div>

        <div className="sticker space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-bold">Couleurs</p>
            <span className="h-7 w-7 rounded-full border-[2.5px] border-ink" style={{ background: color }} aria-label="Couleur actuelle" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Couleur ${c}`}
                aria-pressed={c === color}
                onClick={() => {
                  setColor(c);
                  setTool("brush");
                }}
                className={cn(
                  "aspect-square rounded-xl border-[2.5px] border-ink transition-transform hover:scale-110",
                  c === color && tool === "brush" && "scale-110 ring-4 ring-primary",
                )}
                style={{ background: c }}
              />
            ))}
          </div>
          <label
            className={cn(
              "relative flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border-[2.5px] border-ink font-display font-bold shadow-sticker-sm",
              isCustomColor && tool === "brush" && "ring-4 ring-primary",
            )}
            style={{
              background:
                "linear-gradient(90deg,#ff3b3b,#ff9f1c,#ffe14d,#4cd964,#2fb8ff,#5b6cff,#e05bff,#ff3b8d)",
            }}
          >
            <span className="rounded-full bg-card px-3 py-0.5 text-sm">Spectre de couleurs</span>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setTool("brush");
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Choisir une couleur personnalisée"
            />
          </label>
        </div>

        <div className="sticker space-y-3 p-4">
          <p className="font-display text-lg font-bold">Taille du pinceau</p>
          <div className="grid grid-cols-4 gap-2">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Taille ${s}`}
                aria-pressed={s === size}
                onClick={() => setSize(s)}
                className={cn(
                  "grid aspect-square place-items-center rounded-xl border-[2.5px] border-ink bg-card transition-transform hover:scale-105",
                  s === size && "bg-secondary ring-4 ring-primary",
                )}
              >
                <span
                  className="rounded-full bg-ink"
                  style={{ width: Math.max(4, s * 0.6), height: Math.max(4, s * 0.6) }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Button variant="mint" onClick={() => persist("save")} disabled={!!saving}>
            <Save /> {saving === "save" ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
          {published ? (
            <>
              <Button onClick={() => persist("publish")} disabled={!!saving}>
                <Send /> {saving === "publish" ? "Mise à jour…" : "Mettre à jour la publication"}
              </Button>
              <Button variant="outline" onClick={() => persist("unpublish")} disabled={!!saving}>
                <EyeOff /> Retirer de mon profil
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => persist("publish")} disabled={!!saving}>
              <Send /> {saving === "publish" ? "Publication…" : "Publier"}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
