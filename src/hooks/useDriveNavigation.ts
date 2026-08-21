import { useEffect } from 'react';
import { useExplorerStore } from '../stores/useExplorerStore';

export function useDriveNavigation() {
  const {
    currentFolderId,
    currentFolderName,
    currentView,
    breadcrumbs,
    history,
    historyIndex,
    navigateToFolder,
    navigateToView,
    navigateBack,
    navigateForward,
    navigateUp,
    refresh,
    loadItems,
    loadFolderTree,
  } = useExplorerStore();

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoUp = breadcrumbs.length > 1;

  useEffect(() => {
    loadItems();
    loadFolderTree();
  }, []);

  return {
    currentFolderId,
    currentFolderName,
    currentView,
    breadcrumbs,
    canGoBack,
    canGoForward,
    canGoUp,
    navigateToFolder,
    navigateToView,
    navigateBack,
    navigateForward,
    navigateUp,
    refresh,
  };
}
