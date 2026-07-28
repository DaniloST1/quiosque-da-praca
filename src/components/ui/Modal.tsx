'use client';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={cn(
        "relative bg-white rounded-xl shadow-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-200",
        !className?.includes('max-w-') && "max-w-md",
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-zinc-800">{title}</h2>}
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {children}
      </div>
    </div>,
    document.body
  );
}
