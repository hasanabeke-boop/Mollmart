'use client';

import { useCallback, useEffect, useRef } from 'react';

export type DualPriceRangeProps = {
  min: number;
  max: number;
  rangeMin: number;
  rangeMax: number;
  onChange: (nextMin: number, nextMax: number) => void;
};

export default function DualPriceRange({ min, max, rangeMin, rangeMax, onChange }: DualPriceRangeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const minRef = useRef(min);
  const maxRef = useRef(max);

  const dragActive = useRef(false);

  useEffect(() => {
    minRef.current = min;
    maxRef.current = max;
  }, [min, max]);

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return rangeMin;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return rangeMin;
      const t = (clientX - rect.left) / rect.width;
      const p = Math.min(1, Math.max(0, t));
      return Math.round(rangeMin + p * (rangeMax - rangeMin));
    },
    [rangeMin, rangeMax],
  );

  const beginDrag = useCallback(
    (which: 'min' | 'max') => {
      if (dragActive.current) return;
      dragActive.current = true;

      const move = (ev: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in ev ? (ev.touches[0]?.clientX ?? null) : ev.clientX;
        if (clientX == null) return;
        const v = valueFromClientX(clientX);
        if (which === 'min') {
          onChange(Math.min(v, maxRef.current), maxRef.current);
        } else {
          onChange(minRef.current, Math.max(v, minRef.current));
        }
      };

      const up = () => {
        dragActive.current = false;
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', up);
        window.removeEventListener('touchcancel', up);
      };

      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', move, { passive: true });
      window.addEventListener('touchend', up);
      window.addEventListener('touchcancel', up);
    },
    [onChange, valueFromClientX],
  );

  const onTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-range-thumb]')) return;
    const v = valueFromClientX(e.clientX);
    const dMin = Math.abs(v - min);
    const dMax = Math.abs(v - max);
    if (dMin <= dMax) {
      onChange(Math.min(v, max), max);
    } else {
      onChange(min, Math.max(v, min));
    }
  };

  const pct = (v: number) => {
    if (rangeMax <= rangeMin) return 0;
    return ((v - rangeMin) / (rangeMax - rangeMin)) * 100;
  };

  const pMin = pct(min);
  const pMax = pct(max);
  const segLeft = Math.min(pMin, pMax);
  const segW = Math.max(Math.abs(pMax - pMin), 0.35);

  return (
    <div className="relative pb-1 pt-2">
      <div
        ref={trackRef}
        className="relative mx-auto h-9 w-full cursor-pointer touch-none select-none"
        onMouseDown={onTrackMouseDown}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${segLeft}%`, width: `${segW}%` }}
        />
        <button
          type="button"
          role="slider"
          data-range-thumb="min"
          aria-label="Minimum price"
          aria-orientation="horizontal"
          aria-valuemin={rangeMin}
          aria-valuemax={max}
          aria-valuenow={min}
          className="absolute top-1/2 z-40 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-md cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ left: `${pMin}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            beginDrag('min');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            beginDrag('min');
          }}
        />
        <button
          type="button"
          role="slider"
          data-range-thumb="max"
          aria-label="Maximum price"
          aria-orientation="horizontal"
          aria-valuemin={min}
          aria-valuemax={rangeMax}
          aria-valuenow={max}
          className="absolute top-1/2 z-30 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-md cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ left: `${pMax}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            beginDrag('max');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            beginDrag('max');
          }}
        />
      </div>
    </div>
  );
}
