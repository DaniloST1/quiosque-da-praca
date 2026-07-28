'use client';
import { useState } from 'react';
import { EditableWrapper } from './EditableWrapper';
import { useCMSSave } from './useCMSSave';
import { useCMSStore } from '@/lib/store';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Horario {
  dias: string[];
  abertura: string;
  fechamento: string;
}

interface EditableHoursProps {
  horarios: Horario[];
  table: string;
  field: string;
  id: string;
}

export function EditableHours({
  horarios: initialHorarios,
  table,
  field,
  id,
}: EditableHoursProps) {
  const isEditMode = useCMSStore((s) => s.isEditMode);
  const { save } = useCMSSave();
  
  const [isEditing, setIsEditing] = useState(false);
  const [horarios, setHorarios] = useState<Horario[]>(initialHorarios || []);

  const handleSave = () => {
    save(table, id, field, horarios);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setHorarios(initialHorarios || []);
    setIsEditing(false);
  };

  const updateHorario = (index: number, key: keyof Horario, value: string) => {
    const newHorarios = [...horarios];
    if (key === 'dias') {
      newHorarios[index].dias = value.split(',').map(d => d.trim());
    } else {
      newHorarios[index][key] = value as any;
    }
    setHorarios(newHorarios);
  };

  const removeHorario = (index: number) => {
    const newHorarios = [...horarios];
    newHorarios.splice(index, 1);
    setHorarios(newHorarios);
  };

  const addHorario = () => {
    setHorarios([...horarios, { dias: ['Segunda'], abertura: '18:00', fechamento: '23:00' }]);
  };

  if (!isEditMode) {
    return (
      <ul className="space-y-3 text-sm">
        {horarios.map((h, i) => (
          <li key={i} className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <div>
              <span className="block font-medium capitalize text-zinc-200">
                {h.dias.join(', ')}
              </span>
              <span className="text-zinc-400">
                {h.abertura} às {h.fechamento}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-zinc-800 p-4 rounded-md space-y-4 text-sm border border-zinc-700">
        <h4 className="font-bold text-white mb-2">Editar Horários</h4>
        {horarios.map((h, i) => (
          <div key={i} className="flex flex-col gap-2 p-3 bg-zinc-900 rounded-md relative group">
            <button 
              onClick={() => removeHorario(i)}
              className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-500/20 rounded"
              title="Remover horário"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="pr-8">
              <label className="block text-xs text-zinc-400 mb-1">Dias (separados por vírgula)</label>
              <input
                type="text"
                value={h.dias.join(', ')}
                onChange={(e) => updateHorario(i, 'dias', e.target.value)}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1 outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-zinc-400 mb-1">Abertura</label>
                <input
                  type="time"
                  value={h.abertura}
                  onChange={(e) => updateHorario(i, 'abertura', e.target.value)}
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1 outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-zinc-400 mb-1">Fechamento</label>
                <input
                  type="time"
                  value={h.fechamento}
                  onChange={(e) => updateHorario(i, 'fechamento', e.target.value)}
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1 outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addHorario}
          className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline py-2"
        >
          <Plus className="w-4 h-4" /> Adicionar Horário
        </button>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-700">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="text-zinc-300 hover:text-white">
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Salvar Horários
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EditableWrapper
      table={table}
      field={field}
      id={id}
      onEditClick={() => setIsEditing(true)}
      className="inline-block w-full"
    >
      <ul className="space-y-3 text-sm cursor-pointer hover:opacity-80">
        {horarios.map((h, i) => (
          <li key={i} className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <div>
              <span className="block font-medium capitalize text-zinc-200">
                {h.dias.join(', ')}
              </span>
              <span className="text-zinc-400">
                {h.abertura} às {h.fechamento}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </EditableWrapper>
  );
}
