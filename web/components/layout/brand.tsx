import Image from 'next/image';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/porsche-logo.png" alt="Porsche Club Roma" width={compact ? 30 : 40} height={compact ? 30 : 40} priority />
      <div className="leading-none">
        <div className={`${compact ? 'text-[13px]' : 'text-[15px]'} border-b-2 border-porsche pb-0.5 font-bold tracking-tight`}>
          Porsche Club
        </div>
        <div className={`${compact ? 'text-[11px]' : 'text-[12px]'} pt-1 font-bold tracking-tight`}>
          Roma
        </div>
      </div>
    </div>
  );
}
