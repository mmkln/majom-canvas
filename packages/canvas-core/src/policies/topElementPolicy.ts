export type HitTestableElement = {
  contains(px: number, py: number): boolean;
  zIndex?: number;
};

export type TopElementResolverContext<TElement extends HitTestableElement> = {
  sceneX: number;
  sceneY: number;
  candidates: TElement[];
};

export type TopElementResolver<TElement extends HitTestableElement> = (
  context: TopElementResolverContext<TElement>
) => TElement | null;

/**
 * Returns top-most candidate under pointer using `zIndex`, then array order as tiebreaker.
 */
export const resolveTopElementByZIndex = <
  TElement extends HitTestableElement,
>({
  sceneX,
  sceneY,
  candidates,
}: TopElementResolverContext<TElement>): TElement | null => {
  let top: TElement | null = null;
  let topZ = Number.NEGATIVE_INFINITY;
  let topIndex = -1;

  candidates.forEach((candidate, index) => {
    if (!candidate.contains(sceneX, sceneY)) return;
    const z = candidate.zIndex ?? 0;
    if (z > topZ || (z === topZ && index > topIndex)) {
      top = candidate;
      topZ = z;
      topIndex = index;
    }
  });

  return top;
};
