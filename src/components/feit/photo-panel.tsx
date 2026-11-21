import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Images, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, deletePhoto, listPhotos, savePhoto, type WorkoutPhoto } from "@/lib/photo-store";
import { fmtDate, newId, useFeit } from "@/lib/feit-store";

function usePhotos() {
  const [photos, setPhotos] = useState<(WorkoutPhoto & { url: string })[]>([]);
  async function refresh() {
    try {
      const list = await listPhotos();
      setPhotos((old) => { old.forEach((p) => URL.revokeObjectURL(p.url)); return list.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) })); });
    } catch { setPhotos([]); }
  }
  useEffect(() => { void refresh(); }, []);
  return { photos, refresh };
}

/** "After workout" photo for one day. */
export function DayPhoto({ date }: { date: string }) {
  const { notify } = useFeit();
  const { photos, refresh } = usePhotos();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const dayPhotos = photos.filter((p) => p.date === date);
  async function add(files?: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    try {
      for (const file of list) await savePhoto({ id: newId(), date, createdAt: new Date().toISOString(), blob: await compressImage(file) });
      await refresh();
      notify(list.length > 1 ? `${list.length} workout photos saved on this device.` : "Workout photo saved on this device.");
    } catch { notify("That photo couldn't be saved."); }
  }
  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-bold">After-workout photo</p><p className="text-sm text-muted-foreground">Take a picture or pick one from your gallery to see progress over time.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => camera.current?.click()}><Camera size={16} />Take photo</Button>
          <Button type="button" variant="outline" onClick={() => gallery.current?.click()}><Images size={16} />From gallery</Button>
        </div>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
        <input ref={gallery} type="file" accept="image/*" multiple className="hidden" aria-label="Choose workout photos" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      </div>
      {dayPhotos.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{dayPhotos.map((p) => <PhotoThumb key={p.id} photo={p} onDelete={async () => { await deletePhoto(p.id); await refresh(); }} />)}</div>}
    </div>
  );
}

export function PhotoGallery() {
  const { photos, refresh } = usePhotos();
  if (!photos.length) return <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"><ImagePlus size={18} className="mx-auto mb-1" />Photos you add after workouts will show here.</p>;
  return <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{photos.map((p) => <PhotoThumb key={p.id} photo={p} label={fmtDate(p.date)} onDelete={async () => { await deletePhoto(p.id); await refresh(); }} />)}</div>;
}

function PhotoThumb({ photo, label, onDelete }: { photo: { url: string; date: string }; label?: string; onDelete: () => void }) {
  return (
    <figure className="group relative overflow-hidden rounded-xl bg-muted">
      <img src={photo.url} alt={`Workout photo from ${fmtDate(photo.date)}`} className="aspect-[3/4] w-full object-cover" />
      {label && <figcaption className="absolute inset-x-0 bottom-0 bg-foreground/60 px-2 py-1 text-[0.7rem] font-semibold text-background">{label}</figcaption>}
      <button type="button" aria-label="Delete photo" onClick={() => window.confirm("Delete this photo?") && onDelete()} className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/85 text-destructive"><Trash2 size={14} /></button>
    </figure>
  );
}
