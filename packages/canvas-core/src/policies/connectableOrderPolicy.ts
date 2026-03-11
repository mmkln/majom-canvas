export type ConnectableOrderResolverContext<TConnectable> = {
  connectables: TConnectable[];
  isCreatingConnection: boolean;
};

export type ConnectableOrderResolver<TConnectable> = (
  context: ConnectableOrderResolverContext<TConnectable>
) => TConnectable[];

/**
 * No-op ordering policy that keeps connectables in current order.
 */
export const identityConnectableOrderResolver = <TConnectable>({
  connectables,
}: ConnectableOrderResolverContext<TConnectable>): TConnectable[] =>
  connectables;
