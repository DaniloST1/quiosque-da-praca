/**
 * Helper to delete a record via the server-side admin API (uses service role key, bypasses RLS)
 */
export async function adminDelete(table: string, id: string): Promise<void> {
  const res = await fetch('/api/admin/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, id }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status} ao excluir.`);
  }
}
