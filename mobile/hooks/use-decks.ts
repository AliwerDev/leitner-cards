import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDeck,
  deleteDeck,
  getDeck,
  getDeckStats,
  listDecks,
  updateDeck,
  type DeckInput,
} from "@/lib/api/endpoints/decks";
import { useAuth } from "@/lib/auth/session-context";
import { qk, qkPrefix } from "@/lib/query/keys";

export function useDecks() {
  return useQuery({ queryKey: qk.decks, queryFn: listDecks });
}

export function useDeck(id: number) {
  return useQuery({ queryKey: qk.deck(id), queryFn: () => getDeck(id) });
}

export function useDeckStats(id: number) {
  return useQuery({ queryKey: qk.deckStats(id), queryFn: () => getDeckStats(id) });
}

/**
 * Creating a deck changes the quota.
 *
 * `decks_used` and `decks_remaining` both move, and the create button reads
 * them to decide whether to disable itself, so the session has to be re-read.
 * Missing this is why a Regular account would still show an enabled button
 * after its third deck.
 */
export function useCreateDeck() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();

  return useMutation({
    mutationFn: (input: DeckInput) => createDeck(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.decks });
      await refresh();
    },
  });
}

export function useUpdateDeck(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<DeckInput>) => updateDeck(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.decks }),
        queryClient.invalidateQueries({ queryKey: qk.deck(id) }),
        queryClient.invalidateQueries({ queryKey: qk.deckStats(id) }),
      ]);
    },
  });
}

/**
 * Deleting a deck takes its cards, progress, and history with it - every
 * foreign key to it is ON DELETE CASCADE. So every aggregate is stale, not
 * just the deck list: the due badge, the account-wide stats, and the quota.
 */
export function useDeleteDeck() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();

  return useMutation({
    mutationFn: (id: number) => deleteDeck(id),
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: qk.deck(id) });
      queryClient.removeQueries({ queryKey: qk.cards(id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.decks }),
        queryClient.invalidateQueries({ queryKey: qkPrefix.dueCount }),
        queryClient.invalidateQueries({ queryKey: qkPrefix.due }),
        queryClient.invalidateQueries({ queryKey: qkPrefix.stats }),
      ]);
      await refresh();
    },
  });
}
