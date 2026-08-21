import React, { useEffect, useRef } from 'react';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { FileGrid } from './components/explorer/FileGrid';
import { FileTable } from './components/explorer/FileTable';
import { ContextMenu } from './components/explorer/ContextMenu';
import { SelectionOverlay } from './components/explorer/SelectionOverlay';
import { TransferDrawer } from './components/transfers/TransferDrawer';
import { NewFolderModal } from './components/modals/NewFolderModal';
import { NewFileModal } from './components/modals/NewFileModal';
import { MoveModal } from './components/modals/MoveModal';
import { PropertiesModal } from './components/modals/PropertiesModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { useExplorerStore } from './stores/useExplorerStore';
import { useAuthStore } from './stores/useAuthStore';
import { useTransferStore } from './stores/useTransferStore';
import { useContextMenu } from './hooks/useContextMenu';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { UploadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const {
    viewMode,
    currentView,
    selectedIds,
    items,
    selectAll,
    clearSelection,
    deleteSelected,
    setInlineRenameId,
    navigateBack,
    navigateForward,
    navigateUp,
    refresh,
  } = useExplorerStore();

  const { initAuth } = useAuthStore();
  const { initListener } = useTransferStore();
  const { isOpen, position, targetItem, openMenu, closeMenu } = useContextMenu();
  const { isDraggingOver, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop();

  // Initialize Auth & Transfer progress event listener
  useEffect(() => {
    initAuth();
    const cleanupTransfers = initListener();
    return () => cleanupTransfers();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is actively typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Ctrl + A -> Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      }

      // Escape -> Clear Selection
      if (e.key === 'Escape') {
        clearSelection();
      }

      // Delete / Shift+Delete -> Move to Trash or Delete Permanently
      if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        const isPermanent = e.shiftKey || currentView === 'trash';
        deleteSelected(isPermanent);
      }

      // F2 -> Rename selected item
      if (e.key === 'F2' && selectedIds.length === 1) {
        e.preventDefault();
        setInlineRenameId(selectedIds[0]);
      }

      // Alt + Left -> Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateBack();
      }

      // Alt + Right -> Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigateForward();
      }

      // Alt + Up -> Up One Level
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      }

      // F5 -> Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        refresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, currentView, selectAll, clearSelection, deleteSelected, setInlineRenameId, navigateBack, navigateForward, navigateUp, refresh]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none font-sans">
      {/* Top Navigation Bar */}
      <TopNav />

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Explorer Content Canvas */}
        <main
          ref={contentContainerRef}
          onContextMenu={(e) => openMenu(e, null)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex-1 bg-zinc-950 overflow-y-auto relative scrollbar-thin"
        >
          {/* View Mode Component */}
          {viewMode === 'grid' ? (
            <FileGrid onContextMenu={(e, item) => openMenu(e, item)} />
          ) : (
            <FileTable onContextMenu={(e, item) => openMenu(e, item)} />
          )}

          {/* Rubber-band Marquee Selection Box */}
          <SelectionOverlay containerRef={contentContainerRef} />

          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-sm border-2 border-dashed border-blue-400 z-50 flex flex-col items-center justify-center pointer-events-none dropzone-active">
              <div className="p-5 rounded-2xl bg-blue-600/20 text-blue-400 mb-3 animate-bounce">
                <UploadCloud className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-blue-100">Drop files or folders here</h3>
              <p className="text-xs text-blue-300">Automated chunked resumable upload to current directory</p>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Right Slide-out Transfer Drawer */}
      <TransferDrawer />

      {/* Custom Context Menu */}
      {isOpen && (
        <ContextMenu
          x={position.x}
          y={position.y}
          targetItem={targetItem}
          onClose={closeMenu}
        />
      )}

      {/* Action Modals */}
      <NewFolderModal />
      <NewFileModal />
      <MoveModal />
      <PropertiesModal />
      <SettingsModal />
    </div>
  );
};
