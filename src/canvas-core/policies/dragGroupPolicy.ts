export type DragGroupResolver<TElement> = (selected: TElement[]) => TElement[];

/**
 * No-op drag group policy that keeps selected elements unchanged.
 */
export const identityDragGroupResolver = <TElement>(
  selected: TElement[]
): TElement[] => selected;
