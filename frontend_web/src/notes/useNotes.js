import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNoteWithFallback, deleteNoteWithFallback, listNotesWithFallback, updateNoteWithFallback } from "./notesStore";

// PUBLIC_INTERFACE
export function useNotesList() {
  /** React Query hook for listing notes. */
  return useQuery({
    queryKey: ["notes"],
    queryFn: listNotesWithFallback
  });
}

// PUBLIC_INTERFACE
export function useCreateNote() {
  /** React Query hook for creating notes. */
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNoteWithFallback,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] })
  });
}

// PUBLIC_INTERFACE
export function useUpdateNote() {
  /** React Query hook for updating notes. */
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updateNoteWithFallback(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] })
  });
}

// PUBLIC_INTERFACE
export function useDeleteNote() {
  /** React Query hook for deleting notes. */
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteNoteWithFallback(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] })
  });
}
