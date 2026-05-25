'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useAppStore } from '@/lib/store';

/** 3rd 視点時: トラックパッドのピンチ（ctrl+ホイール）・タッチの2本指ピンチでズーム */
export default function ThirdPersonZoomGesture({
  viewportRef,
}: {
  viewportRef: RefObject<HTMLElement | null>;
}) {
  const cameraMode = useAppStore((s) => s.cameraMode);
  const adjustThirdCameraDistance = useAppStore((s) => s.adjustThirdCameraDistance);
  const pinchStartDist = useRef<number | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || cameraMode !== 'third') return;

    const applyWheelZoom = (deltaY: number) => {
      const step = Math.min(0.55, Math.max(0.12, Math.abs(deltaY) * 0.004));
      adjustThirdCameraDistance(deltaY > 0 ? step : -step);
    };

    const onWheel = (e: WheelEvent) => {
      // トラックパッドのピンチは ctrl/meta + wheel。マウスホイールも 3rd 中はズームに使う
      e.preventDefault();
      applyWheelZoom(e.deltaY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStartDist.current === null) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const diff = dist - pinchStartDist.current;
      pinchStartDist.current = dist;
      if (Math.abs(diff) < 1.5) return;
      e.preventDefault();
      adjustThirdCameraDistance(diff * 0.018);
    };

    const onTouchEnd = () => {
      pinchStartDist.current = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [cameraMode, adjustThirdCameraDistance, viewportRef]);

  return null;
}
