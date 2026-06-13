import { carBodyType, type CarBody } from '@/lib/car-model';

interface Shape { path: string; wheels: [number, number][]; r: number; }

const SHAPES: Record<CarBody, Shape> = {
  // 911 — fastback coupé
  sport911: {
    path: 'M12 76 L16 64 C26 58 44 55 64 53 C82 37 104 32 126 33 C150 34 168 44 196 56 C212 61 224 66 228 76 Z',
    wheels: [[66, 76], [178, 76]], r: 17,
  },
  // 718 Cayman/Boxster — mid-engine, coda corta a cuneo
  sport718: {
    path: 'M14 76 L16 62 C28 56 46 54 66 53 C84 41 100 36 120 37 C146 38 168 47 198 60 C206 64 213 70 213 76 Z',
    wheels: [[64, 76], [176, 76]], r: 16,
  },
  // Cayenne/Macan — SUV, tetto alto e lungo
  suv: {
    path: 'M12 78 L15 56 C17 46 26 40 40 38 C50 30 66 26 96 25 L150 26 C170 27 184 33 198 43 C208 49 216 53 222 60 L223 78 Z',
    wheels: [[64, 78], [180, 78]], r: 18,
  },
  // Panamera/Taycan — berlina 4 porte bassa e lunga
  sedan: {
    path: 'M10 76 L14 64 C26 58 44 55 66 54 C82 44 104 40 138 41 C164 42 186 48 208 57 C218 61 227 66 231 76 Z',
    wheels: [[62, 76], [184, 76]], r: 16,
  },
};

export function CarSilhouette({ modello, body, className = '' }: { modello?: string | null; body?: CarBody; className?: string }) {
  const shape = SHAPES[body ?? carBodyType(modello)];
  return (
    <svg viewBox="0 0 240 96" className={className} role="img" aria-label={modello ?? 'Porsche'}>
      <path d={shape.path} fill="currentColor" />
      {shape.wheels.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={shape.r} fill="currentColor" />
          <circle cx={cx} cy={cy} r={shape.r * 0.5} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="3" />
        </g>
      ))}
    </svg>
  );
}
