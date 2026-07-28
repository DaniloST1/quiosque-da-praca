'use client';
import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface DragListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function DragList<T>({ items, keyExtractor, onReorder, renderItem }: DragListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragNode.current = e.target as HTMLDivElement;
    // Set a slight delay so the dragged element itself doesn't disappear
    setTimeout(() => {
      setDraggedIndex(index);
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    setDraggedIndex(targetIndex);
    onReorder(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    dragNode.current = null;
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`
            flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-colors
            ${draggedIndex === index ? 'opacity-50 border-accent border-dashed' : 'border-zinc-200 hover:border-zinc-300'}
          `}
        >
          <div className="text-zinc-400 cursor-grab active:cursor-grabbing touch-none">
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pointer-events-none">
            {renderItem(item, index)}
          </div>
        </div>
      ))}
    </div>
  );
}
