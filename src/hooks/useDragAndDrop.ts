import { useState, useCallback } from 'react';
import { useTransferStore } from '../stores/useTransferStore';
import { useExplorerStore } from '../stores/useExplorerStore';

export function useDragAndDrop() {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const { currentFolderId, moveSelected } = useExplorerStore();
  const { uploadFiles } = useTransferStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, overrideTargetFolderId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      setDropTargetId(null);

      const targetFolder = overrideTargetFolderId || currentFolderId;

      // 1. Check for internal item move
      const internalData = e.dataTransfer.getData('application/json');
      if (internalData) {
        try {
          const parsed = JSON.parse(internalData);
          if (parsed.type === 'drive-item-move' && parsed.itemId) {
            if (parsed.itemId !== targetFolder) {
              await moveSelected(targetFolder);
            }
            return;
          }
        } catch (err) {}
      }

      // 2. Check for OS Native File drops
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filePaths: string[] = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          // Electron path property on File objects
          const filePath = (file as any).path;
          if (filePath) {
            filePaths.push(filePath);
          }
        }

        if (filePaths.length > 0) {
          await uploadFiles(filePaths, targetFolder);
        }
      }
    },
    [currentFolderId, moveSelected, uploadFiles]
  );

  return {
    isDraggingOver,
    dropTargetId,
    setDropTargetId,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
