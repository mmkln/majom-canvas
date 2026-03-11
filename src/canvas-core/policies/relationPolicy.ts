export type RelationPolicyDecision = {
  allowed: boolean;
  reason?: string;
  relationType?: string;
};

export type RelationPolicyContext<TNode = unknown> = {
  source: TNode;
  target: TNode;
};

export interface RelationPolicy<TNode = unknown> {
  /**
   * Validates whether two nodes can be connected and optionally chooses relation type.
   */
  canConnect(context: RelationPolicyContext<TNode>): RelationPolicyDecision;
}

/**
 * Default policy that allows any connection.
 */
export class AllowAllRelationPolicy<TNode = unknown>
  implements RelationPolicy<TNode>
{
  /**
   * Always returns `allowed: true`.
   */
  public canConnect(
    _context: RelationPolicyContext<TNode>
  ): RelationPolicyDecision {
    return { allowed: true };
  }
}
