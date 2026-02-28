import type { CanvasRelationLifecycleDetail } from './canvasRelationLifecycle.ts';

export type RelationPolicyDecision =
  | { kind: 'allow' }
  | { kind: 'reject'; reason: string }
  | { kind: 'confirm'; message: string };

export type RelationPolicyContext = {
  relation: CanvasRelationLifecycleDetail;
};

export interface RelationPolicy {
  canHandle(context: RelationPolicyContext): boolean;
  evaluate(context: RelationPolicyContext): RelationPolicyDecision;
}

export class RelationPolicyRegistry {
  private readonly policies: RelationPolicy[] = [];

  public register(policy: RelationPolicy): void {
    this.policies.push(policy);
  }

  public evaluate(context: RelationPolicyContext): RelationPolicyDecision {
    for (const policy of this.policies) {
      if (!policy.canHandle(context)) continue;
      return policy.evaluate(context);
    }
    return { kind: 'allow' };
  }
}

