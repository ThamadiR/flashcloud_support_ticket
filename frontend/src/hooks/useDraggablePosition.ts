import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

interface Position {
  x: number;
  y: number;
}

export function useDraggablePosition(initialX = 24, initialY = 24) {
  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem('themeTogglePosition');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { x: initialX, y: initialY };
      }
    }
    return { x: initialX, y: initialY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLButtonElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const pointerIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const dragMovedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const nextPositionRef = useRef<Position | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  useEffect(() => {
    positionRef.current = position;

    if (!isDragging) {
      localStorage.setItem('themeTogglePosition', JSON.stringify(position));
    }
  }, [position, isDragging]);

  const schedulePositionUpdate = (nextPosition: Position) => {
    nextPositionRef.current = nextPosition;

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      if (nextPositionRef.current) {
        setPosition(nextPositionRef.current);
      }
    });
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) {
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    pointerIdRef.current = e.pointerId;
    suppressClickRef.current = false;
    dragMovedRef.current = false;
    element.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) {
        return;
      }

      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;

      if (!dragMovedRef.current) {
        const deltaX = Math.abs(nextX - positionRef.current.x);
        const deltaY = Math.abs(nextY - positionRef.current.y);
        if (deltaX > 3 || deltaY > 3) {
          dragMovedRef.current = true;
        }
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const boundedX = clamp(nextX, 0, Math.max(0, viewportWidth - 48));
      const boundedY = clamp(nextY, 0, Math.max(0, viewportHeight - 48));

      schedulePositionUpdate({ x: boundedX, y: boundedY });
    };

    const finishDragging = (pointerId: number) => {
      if (pointerIdRef.current !== pointerId) {
        return;
      }

      const element = elementRef.current;
      if (element && element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }

      pointerIdRef.current = null;
      setIsDragging(false);
      suppressClickRef.current = dragMovedRef.current;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      finishDragging(e.pointerId);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      finishDragging(e.pointerId);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return false;
    }

    return true;
  };

  return { position, isDragging, handlePointerDown, handleClick, elementRef };
}
