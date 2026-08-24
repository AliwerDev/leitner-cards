import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  countCards,
  createCard,
  createCards,
  deleteCard,
  listCards,
  updateCard,
} from "@/lib/api/endpoints/cards";
import { qk, qkPrefix } from "@/lib/query/keys";

/**
 * A page of cards, with search.
 *
 * `keepPreviousData` is what makes typing in the search box feel continuous:
 * without it every keystroke blanks the list to a spinner and the layout
 * jumps.
 */
export function useCards(deckId: number, q: string, page: number) {
  return useQuery({
    queryKey: qk.cardPage(deckId, q, page),
    queryFn: () => listCards({ deckId, q: q || undefined, page }),
    placeholderData: keepPreviousData,
  });
}

/** Total cards in a deck, for the per-deck quota check. */
export function useCardCount(deckId: number) {
  return useQuery({
    queryKey: qk.cardCount(deckId),
    queryFn: () => countCards(deckId),
  });
}

/**
 * Everything a card mutation invalidates.
 *
 * A new card is level 1 with a zero-day interval, so it is due immediately -
 * which means the badge changes. That badge is account-wide, so BOTH the
 * deck-scoped and the account-wide keys have to be invalidated; hitting only
 * the deck one leaves the tab showing a stale number.
 */
function useCardInvalidation(deckId: number) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.cards(deckId) }),
      queryClient.invalidateQueries({ queryKey: qk.deckStats(deckId) }),
      queryClient.invalidateQueries({ queryKey: qkPrefix.dueCount }),
      queryClient.invalidateQueries({ queryKey: qkPrefix.due }),
      queryClient.invalidateQueries({ queryKey: qkPrefix.stats }),
    ]);
}

export function useCreateCard(deckId: number) {
  const invalidate = useCardInvalidation(deckId);

  return useMutation({
    mutationFn: (input: { front: string; back: string }) => createCard({ deckId, ...input }),
    onSuccess: invalidate,
  });
}

export function useCreateCards(deckId: number) {
  const invalidate = useCardInvalidation(deckId);

  return useMutation({
    mutationFn: (cards: { front: string; back: string }[]) => createCards({ deckId, cards }),
    onSuccess: invalidate,
  });
}

export function useUpdateCard(deckId: number) {
  const invalidate = useCardInvalidation(deckId);

  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; front?: string; back?: string }) =>
      updateCard(id, input),
    // Editing text changes neither the schedule nor any count, so only the
    // list needs to change - but the shared invalidator is cheap and keeps
    // one rule rather than two.
    onSuccess: invalidate,
  });
}

export function useDeleteCard(deckId: number) {
  const invalidate = useCardInvalidation(deckId);

  return useMutation({
    mutationFn: (id: number) => deleteCard(id),
    onSuccess: invalidate,
  });
}
