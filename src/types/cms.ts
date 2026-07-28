export interface CMSField {
  table: string;
  field: string;
  id: string;
  type: 'text' | 'textarea' | 'image' | 'product' | 'banner' | 'promotion' | 'review' | 'rich';
  label?: string;
}

export interface CMSSavePayload {
  table: string;
  field: string;
  id: string;
  value: unknown;
}

export interface CMSContextValue {
  isEditMode: boolean;
  setEditMode: (val: boolean) => void;
  currentUserId: string | null;
  currentUserRole: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
}

export type CMSFieldType = CMSField['type'];
