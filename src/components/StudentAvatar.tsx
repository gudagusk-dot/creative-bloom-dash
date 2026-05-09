import { useState } from "react";

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: number; // pixels
  className?: string;
  ring?: boolean;
}

export const StudentAvatar = ({ name, avatarUrl, size = 44, className = "", ring = false }: Props) => {
  const [errored, setErrored] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();
  const showImg = !!avatarUrl && !errored;
  const ringCls = ring ? "ring-2 ring-background" : "";

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shadow-soft ${ringCls} ${className}`}
      style={{ width: size, height: size }}
    >
      {showImg ? (
        <img
          src={avatarUrl!}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-display font-medium text-primary-foreground" style={{ fontSize: size * 0.4 }}>
          {initial}
        </span>
      )}
    </div>
  );
};
