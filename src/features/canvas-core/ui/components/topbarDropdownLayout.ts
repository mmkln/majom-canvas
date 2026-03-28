export const TOPBAR_DROPDOWN_MARGIN = 8;
export const TOPBAR_DROPDOWN_GAP = 4;

type TopbarDropdownPlacement = 'bottom-start' | 'bottom-end';
type TopbarDropdownFallbackPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end';
type TopbarDropdownAlign = 'start' | 'end';

type TopbarDropdownController = {
  openAt: (options: {
    anchor: HTMLElement;
    placement: TopbarDropdownPlacement;
    fallbackPlacements: TopbarDropdownFallbackPlacement[];
    gap: number;
    margin: number;
    lockPlacementAfterOpen: boolean;
  }) => void;
};

const fallbackByAlign: Record<TopbarDropdownAlign, TopbarDropdownFallbackPlacement[]> =
  {
    start: ['bottom-end', 'top-start', 'top-end'],
    end: ['bottom-start', 'top-end', 'top-start'],
  };

const placementByAlign: Record<TopbarDropdownAlign, TopbarDropdownPlacement> = {
  start: 'bottom-start',
  end: 'bottom-end',
};

export const openTopbarDropdown = (params: {
  controller: TopbarDropdownController;
  anchor: HTMLElement;
  align: TopbarDropdownAlign;
}): void => {
  const { controller, anchor, align } = params;
  controller.openAt({
    anchor,
    placement: placementByAlign[align],
    fallbackPlacements: fallbackByAlign[align],
    gap: TOPBAR_DROPDOWN_GAP,
    margin: TOPBAR_DROPDOWN_MARGIN,
    lockPlacementAfterOpen: true,
  });
};
