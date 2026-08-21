import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import type { DriveFolder } from '../../types/drive';

interface FolderTreeNodeProps {
  folder: DriveFolder;
  depth?: number;
}

export const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({ folder, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { currentFolderId, navigateToFolder } = useExplorerStore();
  const { handleDrop } = useDragAndDrop();

  const isSelected = currentFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    navigateToFolder(folder.id, folder.name);
  };

  return (
    <div className="select-none text-xs">
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 group ${
          isSelected
            ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500'
            : isDragOver
            ? 'bg-blue-600/30 text-blue-300 ring-1 ring-blue-500'
            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleSelect}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          handleDrop(e, folder.id);
        }}
      >
        {/* Expand / Collapse toggle */}
        <button
          onClick={handleToggleExpand}
          className={`p-0.5 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-300 transition-colors ${
            !hasChildren ? 'invisible' : ''
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          )}
        </button>

        {/* Folder Icon */}
        {isSelected || isExpanded ? (
          <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
        )}

        <span className="truncate flex-1 font-medium">{folder.name}</span>
      </div>

      {/* Render children recursively */}
      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {folder.children!.map((child) => (
            <FolderTreeNode key={child.id} folder={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC = () => {
  const { folderTree } = useExplorerStore();

  if (!folderTree || folderTree.length === 0) {
    return (
      <div className="text-[11px] text-zinc-500 px-3 py-2 italic">
        No subfolders found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {folderTree.map((folder) => (
        <FolderTreeNode key={folder.id} folder={folder} />
      ))}
    </div>
  );
};
