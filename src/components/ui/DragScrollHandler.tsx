'use client';

import { useEffect } from 'react';

export function DragScrollHandler() {
  useEffect(() => {
    let activeContainer: HTMLElement | null = null;
    let isMouseDown = false;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only main click (left mouse button)
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Don't drag if user is interacting directly with interactive form fields
      if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(target.tagName)) {
        return;
      }

      // Find nearest horizontal scroll container
      const container = target.closest(
        '.overflow-x-auto, .overflow-x-scroll, [data-drag-scroll]'
      ) as HTMLElement | null;

      if (!container) return;

      // Check if container is actually horizontally scrollable
      if (container.scrollWidth <= container.clientWidth) return;

      activeContainer = container;
      isMouseDown = true;
      isDragging = false;
      startX = e.clientX;
      scrollLeft = container.scrollLeft;

      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || !activeContainer) return;

      const dx = e.clientX - startX;

      // 5px threshold to activate drag mode
      if (!isDragging && Math.abs(dx) > 5) {
        isDragging = true;
        activeContainer.style.cursor = 'grabbing';
        activeContainer.style.userSelect = 'none';
      }

      if (isDragging) {
        e.preventDefault();
        activeContainer.scrollLeft = scrollLeft - dx;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDown) return;

      if (isDragging && activeContainer) {
        // Prevent click trigger on items inside container when user was dragging
        const preventClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        window.addEventListener('click', preventClick, { capture: true, once: true });

        activeContainer.style.cursor = '';
        activeContainer.style.userSelect = '';
      }

      isMouseDown = false;
      isDragging = false;
      activeContainer = null;

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };
  }, []);

  return null;
}
