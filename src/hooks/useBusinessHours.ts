'use client';
import { useState, useEffect } from 'react';
import { isOpen } from '@/lib/utils';
import { HorarioItem } from '@/types/database';

export function useBusinessHours(horarios: HorarioItem[] = []) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check initially
    setTimeout(() => {
      setOpen(isOpen(horarios));
    }, 0);

    // Update every minute
    const interval = setInterval(() => {
      setOpen(isOpen(horarios));
    }, 60000);

    return () => clearInterval(interval);
  }, [horarios]);

  return open;
}
