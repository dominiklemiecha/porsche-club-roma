import Image from 'next/image';

export function Brand({ compact = false }: { compact?: boolean }) {
  const size = compact ? 36 : 48;
  return (
    <Image src="/porsche-logo.png" alt="Porsche Club Roma" width={size} height={size} priority />
  );
}
