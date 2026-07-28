'use client';
import { useState } from 'react';
import { EditableWrapper } from './EditableWrapper';
import { Modal } from '@/components/ui/Modal';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useCMSSave } from './useCMSSave';
import { useCMSStore } from '@/lib/store';
import { StorageBucket } from '@/lib/storage';

interface EditableImageProps {
  src: string | null;
  table: string;
  field: string;
  id: string;
  bucket: StorageBucket;
  children: React.ReactNode;
  className?: string;
}

export function EditableImage({
  src: initialSrc,
  table,
  field,
  id,
  bucket,
  children,
  className,
}: EditableImageProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const { save } = useCMSSave();
  const [isOpen, setIsOpen] = useState(false);

  const handleUploadSuccess = (newUrl: string) => {
    setIsOpen(false);
    save(table, id, field, newUrl);
  };

  if (!isEditMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <EditableWrapper 
        table={table} 
        field={field} 
        id={id} 
        type="image" 
        className={className}
        onEditClick={() => setIsOpen(true)}
      >
        {children}
      </EditableWrapper>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Upload de Imagem"
        className="max-w-[580px]"
      >
        <ImageUploader 
          bucket={bucket}
          currentImage={initialSrc}
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
