import Image from 'next/image';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/porsche-logo.png" alt="Porsche Club Roma" width={compact ? 30 : 38} height={compact ? 30 : 38} priority />
      <div className="leading-none">
        <div className={compact ? 'text-[13px] font-bold tracking-tight' : 'text-[15px] font-bold tracking-tight'}>
          Porsche Club
        </div>
        <div className="mt-0.5 inline-block border-b-2 border-porsche pb-0.5 text-[11px] font-medium tracking-[0.08em] text-ink/70">
          Roma
        </div>
      </div>
    </div>
  );
}
