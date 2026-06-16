export function Footer() {
  return (
    <footer className="mt-10 px-6 lg:px-8 pb-8">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-line to-porsche" />
        <span className="text-[15px] font-bold tracking-[0.42em] text-ink">PORSCHE</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-line to-porsche" />
      </div>
      <p className="mt-3 text-center text-xs text-ink/45">
        Porsche Club Roma · Campionato Sociale 2026
      </p>
    </footer>
  );
}
