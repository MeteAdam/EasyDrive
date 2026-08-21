import React from 'react';
import { ChevronRight, HardDrive, Folder } from 'lucide-react';
import { useExplorerStore } from '../../stores/useExplorerStore';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

export const Breadcrumb: React.FC = () => {
  const { breadcrumbs, navigateToFolder } = useExplorerStore();
  const { handleDrop } = useDragAndDrop();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto text-sm text-zinc-300 py-1 px-2.5 bg-zinc-900 border border-zinc-750 rounded-lg flex-1 max-w-xl shadow-inner scrollbar-none">
      {breadcrumbs.map((node, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isRoot = index === 0;

        return (
          <React.Fragment key={node.id}>
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors text-xs font-medium shrink-0 ${
                isLast
                  ? 'bg-zinc-800 text-blue-400 font-semibold shadow-sm'
                  : 'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
              }`}
              onClick={() => navigateToFolder(node.id, node.name)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-blue-600/30', 'text-blue-300');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-600/30', 'text-blue-300');
              }}
              onDrop={(e) => {
                e.currentTarget.classList.remove('bg-blue-600/30', 'text-blue-300');
                handleDrop(e, node.id);
              }}
            >
              {isRoot ? (
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="truncate max-w-[140px]">{node.name}</span>
            </div>

            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
