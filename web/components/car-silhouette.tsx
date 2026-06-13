import { carBodyType, type CarBody } from '@/lib/car-model';

interface Shape { path: string; wheels: [number, number][]; r: number; }

const SHAPES: Record<CarBody, Shape> = {
  // 911 — coupé fastback
  sport911: {
    path: 'M16 80 L18 64 C26 56 40 52 58 50 C76 36 100 30 126 31 C154 32 176 41 204 55 C222 61 236 66 242 76 L242 80 L210 80 A20 20 0 0 0 170 80 L92 80 A20 20 0 0 0 52 80 Z',
    wheels: [[72, 80], [190, 80]], r: 17,
  },
  // 718 Cayman/Boxster — mid-engine, coda corta
  sport718: {
    path: 'M18 80 L20 62 C30 55 46 52 66 51 C82 42 100 37 122 37 C146 37 168 44 196 56 C214 62 228 67 234 76 L234 80 L206 80 A20 20 0 0 0 166 80 L92 80 A20 20 0 0 0 52 80 Z',
    wheels: [[72, 80], [186, 80]], r: 17,
  },
  // Cayenne/Macan — SUV, tetto alto e lungo
  suv: {
    path: 'M14 82 L16 56 C18 46 28 41 44 39 C54 30 70 27 100 26 C140 26 152 27 172 29 C190 31 204 38 216 48 C226 54 236 59 242 68 L242 82 L214 82 A22 22 0 0 0 170 82 L94 82 A22 22 0 0 0 50 82 Z',
    wheels: [[72, 82], [192, 82]], r: 19,
  },
  // Panamera/Taycan — berlina 4 porte bassa e lunga
  sedan: {
    path: 'M12 80 L14 64 C26 57 42 53 64 52 C80 43 104 39 140 40 C168 41 192 47 214 56 C228 61 242 66 248 76 L248 80 L216 80 A20 20 0 0 0 176 80 L86 80 A20 20 0 0 0 46 80 Z',
    wheels: [[66, 80], [196, 80]], r: 17,
  },
};

export function CarSilhouette({ modello, body, className = '' }: { modello?: string | null; body?: CarBody; className?: string }) {
  const shape = SHAPES[body ?? carBodyType(modello)];
  return (
    <svg viewBox="0 0 260 96" className={className} role="img" aria-label={modello ?? 'Porsche'}>
      <path d={shape.path} fill="currentColor" />
      {shape.wheels.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={shape.r} fill="currentColor" />
      ))}
    </svg>
  );
}
