import { useState, useCallback, useEffect } from 'react';
import type { DriveItem } from '../types/drive';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [targetItem, setTargetItem] = useState<DriveItem | null>(null);

  const openMenu = useCallback((e: React.MouseEvent, item: DriveItem | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 240;
    const menuHeight = 320;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }

    setPosition({ x: Math.max(10, x), y: Math.max(10, y) });
    setTargetItem(item);
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setTargetItem(null);
  }, []);

  // Close when clicking anywhere or resizing window
  useEffect(() => {
    const handleWindowClick = () => {
      if (isOpen) closeMenu();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    };

    window.addEventListener('click', handleWindowClick);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  return {
    isOpen,
    position,
    targetItem,
    openMenu,
    closeMenu,
  };
}
