'use client';
import { ReactNode } from 'react';
import { useCMSStore } from '@/lib/store';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CMSFieldType } from '@/types/cms';

interface EditableWrapperProps {
  children: ReactNode;
  table: string;
  field: string;
  id: string;
  type?: CMSFieldType;
  className?: string;
  onEditClick?: () => void;
  as?: React.ElementType;
}

export function EditableWrapper({
  children,
  table,
  field,
  id,
  type = 'text',
  className,
  onEditClick,
  as: Component = 'div',
}: EditableWrapperProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);

  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <Component
      className={cn(
        'relative group rounded-md outline outline-2 outline-transparent hover:outline-dashed hover:outline-accent/50 transition-all',
        className
      )}
      onClick={(e: React.MouseEvent) => {
        if (onEditClick) {
          e.preventDefault();
          e.stopPropagation();
          onEditClick();
        }
      }}
    >
      {/* Edit Button overlay on hover */}
      {onEditClick && (
        <button className="absolute top-3 right-3 z-10 bg-accent text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {children}
    </Component>
  );
}
