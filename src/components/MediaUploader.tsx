import { useRef, useState } from "react";
import { Upload, Trash2, Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  postId: string;
  mediaUrls: string[];
  canDelete: boolean;
  onChange: (urls: string[]) => void;
}

const MAX_BYTES = 50 * 1024 * 1024;

export const MediaUploader = ({ postId, mediaUrls, canDelete, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        alert(`${file.name} ultrapassa 50MB e foi ignorado.`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `${postId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("post-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        alert("Erro ao enviar: " + error.message);
        continue;
      }
      const { data } = supabase.storage.from("post-media").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }
    onChange([...(mediaUrls || []), ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (url: string) => {
    if (!confirm("Remover esta mídia?")) return;
    const idx = url.indexOf("/post-media/");
    if (idx >= 0) {
      const path = url.slice(idx + "/post-media/".length);
      await supabase.storage.from("post-media").remove([path]);
    }
    onChange((mediaUrls || []).filter(u => u !== url));
  };

  const isVideo = (u: string) => /\.(mp4|mov|webm)(\?|$)/i.test(u);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Mídia produzida
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Enviando..." : "Enviar"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {(!mediaUrls || mediaUrls.length === 0) ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Nenhuma mídia enviada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {mediaUrls.map(url => (
            <div key={url} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-square">
              {isVideo(url) ? (
                <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                  <VideoIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={url}
                  alt="mídia"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreview(url)}
                />
              )}
              <button
                type="button"
                onClick={() => setPreview(url)}
                className="absolute inset-0 bg-foreground/0 hover:bg-foreground/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
              >
                <ImageIcon className="h-5 w-5 text-white" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(url)}
                  className="absolute top-1 right-1 p-1 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-foreground/80 flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          {isVideo(preview) ? (
            <video src={preview} controls className="max-w-full max-h-full rounded-lg" />
          ) : (
            <img src={preview} alt="preview" className="max-w-full max-h-full rounded-lg" />
          )}
        </div>
      )}
    </div>
  );
};
