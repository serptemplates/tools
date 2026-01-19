"use client";

type ToolVideoPanelProps = {
  embedId: string;
  autoplay?: boolean;
  className?: string;
};

export function ToolVideoPanel({ embedId, autoplay = false, className }: ToolVideoPanelProps) {
  if (!embedId) return null;

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 ${className ?? ""}`}
      style={{ aspectRatio: "16/9" }}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${embedId}?${autoplay ? "autoplay=1&" : ""}mute=1&loop=1&playlist=${embedId}&controls=1&showinfo=0&rel=0&modestbranding=1`}
        title="Tool Demo Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: "none" }}
      />
    </div>
  );
}
