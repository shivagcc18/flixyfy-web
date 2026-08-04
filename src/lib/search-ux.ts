export type SuggestionGateInput = {
  focused: boolean;
  value: string;
  submittedValue: string;
  itemCount: number;
  blocked: boolean;
};

export function shouldOpenSuggestions(input: SuggestionGateInput): boolean {
  return input.focused && !input.blocked && input.itemCount > 0 && input.value.trim() !== input.submittedValue.trim();
}

export function isCurrentSuggestionResponse(input: {
  requestId: number;
  currentRequestId: number;
  query: string;
  currentQuery: string;
  submittedValue: string;
  focused: boolean;
  blocked: boolean;
}): boolean {
  return input.requestId === input.currentRequestId
    && input.focused
    && !input.blocked
    && input.query.trim() === input.currentQuery.trim()
    && input.query.trim() !== input.submittedValue.trim();
}
