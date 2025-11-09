type VideoSectionProps = {
  embedId?: string;
};

export function VideoSection({ embedId }: VideoSectionProps) {
  if (!embedId) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-900">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${embedId}`}
            title="How It Works"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}