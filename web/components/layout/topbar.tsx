export function Topbar() {
  return (
    <header className="hidden items-center justify-end gap-4 px-6 pt-5 lg:flex lg:px-8">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">
          A
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Amministratore</div>
          <div className="text-xs text-ink/50">Porsche Club Roma</div>
        </div>
      </div>
    </header>
  );
}
