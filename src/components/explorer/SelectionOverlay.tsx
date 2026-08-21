import React, { useState, useEffect, useRef } from 'react';
import { useExplorerStore } from '../../stores/useExplorerStore';

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface SelectionOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ containerRef }) => {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const isMouseDownRef = useRef(false);
  const { items, setSelectedIds } = useExplorerStore();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only trigger on primary left click
      if (e.button !== 0) return;
      // If clicking directly on a file item or interactive button, ignore
      const target = e.target as HTMLElement;
      if (target.closest('[data-selectable="true"]') || target.closest('button') || target.closest('input')) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const startX = e.clientX - rect.left + container.scrollLeft;
      const startY = e.clientY - rect.top + container.scrollTop;

      isMouseDownRef.current = true;
      setSelectionBox({ startX, startY, currentX: startX, currentY: startY });

      // Clear previous selection unless Shift/Ctrl is held
      if (!e.ctrlKey && !e.shiftKey) {
        setSelectedIds([]);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !selectionBox) return;

      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left + container.scrollLeft;
      const currentY = e.clientY - rect.top + container.scrollTop;

      setSelectionBox((prev) => (prev ? { ...prev, currentX, currentY } : null));

      // Calculate intersection with file items
      const boxLeft = Math.min(selectionBox.startX, currentX);
      const boxTop = Math.min(selectionBox.startY, currentY);
      const boxRight = Math.max(selectionBox.startX, currentX);
      const boxBottom = Math.max(selectionBox.startY, currentY);

      const itemElements = container.querySelectorAll('[data-selectable="true"]');
      const intersectedIds: string[] = [];

      itemElements.forEach((el) => {
        const itemRect = el.getBoundingClientRect();
        const itemLeft = itemRect.left - rect.left + container.scrollLeft;
        const itemTop = itemRect.top - rect.top + container.scrollTop;
        const itemRight = itemLeft + itemRect.width;
        const itemBottom = itemTop + itemRect.height;

        const isIntersecting = !(
          boxRight < itemLeft ||
          boxLeft > itemRight ||
          boxBottom < itemTop ||
          boxTop > itemBottom
        );

        if (isIntersecting) {
          const id = el.getAttribute('data-id');
          if (id) intersectedIds.push(id);
        }
      });

      setSelectedIds(intersectedIds);
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      setSelectionBox(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, selectionBox, items, setSelectedIds]);

  if (!selectionBox) return null;

  const left = Math.min(selectionBox.startX, selectionBox.currentX);
  const top = Math.min(selectionBox.startY, selectionBox.currentY);
  const width = Math.abs(selectionBox.currentX - selectionBox.startX);
  const height = Math.abs(selectionBox.currentY - selectionBox.startY);

  return (
    <div
      className="selection-marquee"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};
