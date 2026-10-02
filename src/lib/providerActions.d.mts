export type ProviderAction = {
  availability_type: string;
  button_url?: string | null;
  navigation_kind: string;
  provider_key: string;
  media_kind?: string;
  video_id?: string | null;
};

export function normalizeAvailabilityType(value: unknown): string;
export function providerActionIsNavigable(item: ProviderAction): boolean;
export function approvedProviderActions<T extends ProviderAction>(
  providers: T[],
  maxItems?: number,
): T[];
