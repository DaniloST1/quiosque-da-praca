'use client';
import { useState, useRef, useEffect } from 'react';
import { EditableWrapper } from './EditableWrapper';
import { useCMSSave } from './useCMSSave';
import { useCMSStore } from '@/lib/store';
import { cn, formatCurrency } from '@/lib/utils';

interface EditablePriceProps {
  price: number;
  table: string;
  field: string;
  id: string;
  className?: string;
}

export function EditablePrice({
  price: initialPrice,
  table,
  field,
  id,
  className,
}: EditablePriceProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const { save } = useCMSSave();
  
  const [price, setPrice] = useState(initialPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialPrice.toString());
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if prop changes externally
  useEffect(() => {
    setPrice(initialPrice);
    setInputValue(initialPrice.toString());
  }, [initialPrice]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newPrice = parseFloat(inputValue);
    
    if (!isNaN(newPrice) && newPrice !== price && newPrice >= 0) {
      setPrice(newPrice);
      save(table, id, field, newPrice);
    } else {
      // Revert if invalid
      setInputValue(price.toString());
    }
    
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setInputValue(price.toString());
      setIsEditing(false);
    }
  };

  if (!isEditMode) {
    return <span className={className}>{formatCurrency(price)}</span>;
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min="0"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-24 bg-white text-zinc-900 border-2 border-[var(--color-primary)] rounded-md px-2 py-0.5 outline-none font-bold text-sm',
          className
        )}
      />
    );
  }

  return (
    <EditableWrapper 
      table={table} 
      field={field} 
      id={id} 
      as="span"
      onEditClick={() => setIsEditing(true)}
      className="inline-block"
    >
      <span className={cn('cursor-pointer hover:opacity-80', className)}>
        {formatCurrency(price)}
      </span>
    </EditableWrapper>
  );
}
