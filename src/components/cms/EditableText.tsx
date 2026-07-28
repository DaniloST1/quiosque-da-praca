'use client';
import { useState, useRef, useEffect } from 'react';
import { EditableWrapper } from './EditableWrapper';
import { useCMSSave } from './useCMSSave';
import { useCMSStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  text: string;
  table: string;
  field: string;
  id: string;
  as?: React.ElementType;
  className?: string;
  multiline?: boolean;
}

export function EditableText({
  text: initialText,
  table,
  field,
  id,
  as: Component = 'span',
  className,
  multiline = false,
}: EditableTextProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const { save } = useCMSSave();
  const [text, setText] = useState(initialText);
  const contentRef = useRef<HTMLElement>(null);

  // Sync if prop changes externally
  useEffect(() => {
    setText(initialText);
    if (contentRef.current && contentRef.current.innerText !== initialText) {
      contentRef.current.innerText = initialText;
    }
  }, [initialText]);

  const handleBlur = () => {
    if (!contentRef.current) return;
    const newText = contentRef.current.innerText.trim();
    if (newText !== text) {
      setText(newText);
      save(table, id, field, newText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      contentRef.current?.blur();
    }
    if (e.key === 'Escape') {
      if (contentRef.current) {
        contentRef.current.innerText = text;
        contentRef.current.blur();
      }
    }
  };

  if (!isEditMode) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <EditableWrapper table={table} field={field} id={id} as={Component}>
      <Component
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'outline-none focus:bg-black/5 focus:ring-2 focus:ring-accent rounded-sm px-1 -mx-1 min-w-[20px] inline-block cursor-text',
          className
        )}
      >
        {text}
      </Component>
    </EditableWrapper>
  );
}
