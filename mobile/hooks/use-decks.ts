import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
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
 * Fanning out one stats request per deck is free for a Regular account
 * (3 decks) but would be self-inflicted load for a Premium user with 200.
 * Past this many decks the counts appear on the detail page instead.
 *
 * Mirrors STATS_FANOUT_LIMIT in frontend/src/app/(app)/decks/page.tsx.
 */
const STATS_FANOUT_LIMIT = 12;

export type DeckCounts = { total: number; due: number };

/**
 * The card and due counts behind each deck in the list.
 *
 * The keys are qk.deckStats, the same ones the detail screen uses, so opening
 * a deck reads the count already in the cache instead of refetching it.
 */
export function useDeckCounts(deckIds: number[]): Record<number, DeckCounts> {
  const ids = deckIds.length > 0 && deckIds.length <= STATS_FANOUT_LIMIT ? deckIds : [];

  return useQueries({
    queries: ids.map((id) => ({
      queryKey: qk.deckStats(id),
      queryFn: () => getDeckStats(id),
    })),
    combine: (results) => {
      const counts: Record<number, DeckCounts> = {};
      results.forEach((result, index) => {
        const id = ids[index];
        const stats = result.data?.stats;
        // A deck whose stats have not arrived, or failed, is simply absent.
        // The card renders without counts rather than showing a wrong zero.
        if (id !== undefined && stats) {
          counts[id] = { total: stats.total_cards, due: stats.due_now };
        }
      });
      return counts;
    },
  });
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
