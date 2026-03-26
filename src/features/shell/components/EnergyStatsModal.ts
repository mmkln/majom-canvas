import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import {
  createSegmentedControl,
  createSurface,
  createTextButton,
  type SegmentedControl,
} from '../../../ui-lib/src/hud/index.ts';
import { type AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { I18nService } from '../../../i18n/index.ts';
import { EnergyLevel, type EnergyRecord } from '../energy.ts';
import { getEnergyLevelLabel } from '../energyPresentation.ts';

const ENERGY_STATS_PERIOD_DAYS = 14;
const ENERGY_STATS_PERIOD_OPTIONS = [7, 14, 30] as const;
const CHART_WIDTH = 640;
const CHART_HEIGHT = 240;
const CHART_PADDING = {
  top: 20,
  right: 18,
  bottom: 24,
  left: 88,
} as const;

export class EnergyStatsModal {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private overlay: HTMLDivElement | null = null;
  private header: HTMLDivElement | null = null;
  private subtitleElement: HTMLParagraphElement | null = null;
  private body: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private periodControl: SegmentedControl<number> | null = null;
  private loading = false;
  private error = false;
  private records: EnergyRecord[] = [];
  private selectedDays = ENERGY_STATS_PERIOD_DAYS;
  private loadRequestId = 0;

  constructor(runtime: AppRuntime = createAppRuntime()) {
    this.runtime = runtime;
    this.i18n = runtime.i18n;
  }

  public open(): void {
    if (this.overlay) return;

    const { overlay, header, body, footer } = createModalShell(
      this.i18n.t('energyStats.title'),
      {
        subtitle: this.i18n.t('energyStats.subtitle', {
          days: this.selectedDays,
        }),
        onClose: () => this.close(),
        zIndex: 280,
      }
    );
    this.overlay = overlay;
    this.header = header;
    this.subtitleElement = header.querySelector('p');
    this.body = body;
    this.footer = footer;
    this.renderFooter();
    this.render();
    void this.load();
  }

  public close(): void {
    this.periodControl?.destroy();
    this.periodControl = null;
    this.overlay?.remove();
    this.overlay = null;
    this.header = null;
    this.subtitleElement = null;
    this.body = null;
    this.footer = null;
  }

  public destroy(): void {
    this.close();
  }

  private async load(): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loading = true;
    this.error = false;
    this.updateSubtitle();
    this.render();
    try {
      const records = await this.runtime.loadEnergyHistory({
        days: this.selectedDays,
      });
      if (requestId !== this.loadRequestId) return;
      this.records = records;
      this.loading = false;
      this.render();
    } catch (error) {
      if (requestId !== this.loadRequestId) return;
      console.warn('Failed to load energy stats.', error);
      this.loading = false;
      this.error = true;
      this.render();
    }
  }

  private render(): void {
    if (!this.body) return;
    this.periodControl?.destroy();
    this.periodControl = null;
    this.body.replaceChildren();
    this.body.appendChild(this.createPeriodControlRow());

    if (this.loading) {
      this.body.appendChild(
        this.createMessage(this.i18n.t('energyStats.loading'))
      );
      return;
    }

    if (this.error) {
      this.body.appendChild(
        this.createMessage(this.i18n.t('energyStats.error'), 'text-rose-600')
      );
      return;
    }

    if (this.records.length === 0) {
      this.body.appendChild(
        this.createMessage(this.i18n.t('energyStats.empty'))
      );
      return;
    }

    this.body.appendChild(this.createChartSurface(this.records));
  }

  private renderFooter(): void {
    if (!this.footer) return;
    const row = createModalActionRow({ variant: 'confirm' });
    row.appendChild(
      createTextButton({
        text: this.i18n.t('common.close'),
        tone: 'text',
        size: 'md',
        className: getModalActionButtonClass('default'),
        onClick: () => this.close(),
      })
    );
    this.footer.replaceChildren(row);
  }

  private updateSubtitle(): void {
    if (!this.subtitleElement) return;
    this.subtitleElement.textContent = this.i18n.t('energyStats.subtitle', {
      days: this.selectedDays,
    });
  }

  private createMessage(
    text: string,
    className: string = 'text-slate-500'
  ): HTMLParagraphElement {
    const message = document.createElement('p');
    message.className = `text-sm leading-6 ${className}`;
    message.textContent = text;
    return message;
  }

  private createPeriodControlRow(): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'mb-4 flex items-center justify-end';

    this.periodControl = createSegmentedControl<number>({
      ariaLabel: this.i18n.t('energyStats.periodSelector'),
      size: 'sm',
      variant: 'bare',
      value: this.selectedDays,
      options: ENERGY_STATS_PERIOD_OPTIONS.map((days) => ({
        id: `energy-stats-period-${days}`,
        value: days,
        label: this.getPeriodOptionLabel(days),
        title: this.i18n.t('energyStats.periodOptionTitle', { days }),
      })),
      onChange: (days) => {
        if (days === this.selectedDays) return;
        this.selectedDays = days;
        void this.load();
      },
    });
    row.appendChild(this.periodControl.element);
    return row;
  }

  private createChartSurface(records: EnergyRecord[]): HTMLDivElement {
    const surface = createSurface({
      className: 'rounded-2xl px-4 py-4',
    });
    surface.classList.add('overflow-hidden');

    const chartRegion = document.createElement('div');
    chartRegion.className = 'relative';
    const tooltip = this.createTooltip();
    const chart = this.createLineChart(records, chartRegion, tooltip);
    const axis = document.createElement('div');
    axis.className =
      'mt-3 flex items-center justify-between text-xs font-medium text-slate-400';
    axis.append(
      this.createAxisLabel(this.getChartStartDate()),
      this.createAxisLabel(this.getChartEndDate(), 'text-right')
    );

    chartRegion.append(chart, tooltip);
    surface.append(chartRegion, axis);
    return surface;
  }

  private createLineChart(
    records: EnergyRecord[],
    chartRegion: HTMLDivElement,
    tooltip: HTMLDivElement
  ): SVGSVGElement {
    const series = this.buildChartSeries(records);
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('data-role', 'energy-line-chart');
    svg.setAttribute(
      'aria-label',
      this.i18n.t('energyStats.chartAriaLabel', {
        days: this.selectedDays,
      })
    );
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '220px';

    [
      EnergyLevel.VERY_HIGH,
      EnergyLevel.HIGH,
      EnergyLevel.NEUTRAL,
      EnergyLevel.LOW,
      EnergyLevel.VERY_LOW,
    ].forEach((level) => {
      const y = this.getChartY(Number(level), plotHeight);
      const gridLine = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      gridLine.setAttribute('x1', `${CHART_PADDING.left}`);
      gridLine.setAttribute('x2', `${CHART_WIDTH - CHART_PADDING.right}`);
      gridLine.setAttribute('y1', `${y}`);
      gridLine.setAttribute('y2', `${y}`);
      gridLine.setAttribute('stroke', 'rgba(148, 163, 184, 0.18)');
      gridLine.setAttribute('stroke-width', '1');
      svg.appendChild(gridLine);
      svg.appendChild(this.createAxisText(level, y));
    });

    const segments = this.buildChartSegments(series, plotWidth, plotHeight);
    segments.forEach((segmentPath) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', segmentPath);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#4f46e5');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    });

    series.forEach((entry, index) => {
      if (!entry) return;
      const cx = this.getChartX(index, plotWidth, series.length);
      const cy = this.getChartY(Number(entry.record.energy), plotHeight);
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', `${cx}`);
      point.setAttribute('cy', `${cy}`);
      point.setAttribute('r', '4.5');
      point.setAttribute('fill', '#4f46e5');
      point.setAttribute('stroke', '#ffffff');
      point.setAttribute('stroke-width', '2');
      point.setAttribute('tabindex', '0');

      const showTooltip = (): void => {
        this.showTooltip(chartRegion, tooltip, point, entry);
      };
      point.addEventListener('mouseenter', showTooltip);
      point.addEventListener('mousemove', showTooltip);
      point.addEventListener('focus', showTooltip);
      point.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
      point.addEventListener('blur', () => this.hideTooltip(tooltip));
      svg.appendChild(point);
    });

    return svg;
  }

  private buildChartSeries(
    records: EnergyRecord[]
  ): Array<{ date: Date; record: EnergyRecord } | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - (this.selectedDays - 1));

    const latestByDay = new Map<string, { date: Date; record: EnergyRecord }>();
    records.forEach((record) => {
      const date = new Date(record.recordedAt);
      if (Number.isNaN(date.getTime())) return;
      const key = this.getDayKey(date);
      const existing = latestByDay.get(key);
      if (!existing || new Date(existing.record.recordedAt) < date) {
        latestByDay.set(key, { date, record });
      }
    });

    return Array.from({ length: this.selectedDays }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return latestByDay.get(this.getDayKey(day)) ?? null;
    });
  }

  private buildChartSegments(
    series: Array<{ date: Date; record: EnergyRecord } | null>,
    plotWidth: number,
    plotHeight: number
  ): string[] {
    const segments: string[] = [];
    let currentPoints: Array<{ x: number; y: number }> = [];

    series.forEach((entry, index) => {
      if (!entry) {
        if (currentPoints.length > 1) {
          segments.push(this.createStepSegmentPath(currentPoints));
        }
        currentPoints = [];
        return;
      }
      currentPoints.push({
        x: this.getChartX(index, plotWidth, series.length),
        y: this.getChartY(Number(entry.record.energy), plotHeight),
      });
    });

    if (currentPoints.length > 1) {
      segments.push(this.createStepSegmentPath(currentPoints));
    }
    return segments;
  }

  private createStepSegmentPath(
    points: Array<{ x: number; y: number }>
  ): string {
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index += 1) {
      const current = points[index];
      path += ` H ${current.x} V ${current.y}`;
    }
    return path;
  }

  private getChartX(
    index: number,
    plotWidth: number,
    pointCount: number
  ): number {
    if (pointCount <= 1) {
      return CHART_PADDING.left + plotWidth / 2;
    }
    return CHART_PADDING.left + (plotWidth / (pointCount - 1)) * index;
  }

  private getChartY(level: number, plotHeight: number): number {
    const normalizedLevel = Math.min(Math.max(level, 1), 5);
    return (
      CHART_PADDING.top + ((5 - normalizedLevel) / 4) * plotHeight
    );
  }

  private getChartStartDate(): Date {
    const latest = this.getChartEndDate();
    const start = new Date(latest);
    start.setDate(latest.getDate() - (this.selectedDays - 1));
    return start;
  }

  private getChartEndDate(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private createAxisLabel(date: Date, className: string = ''): HTMLSpanElement {
    const label = document.createElement('span');
    label.className = className;
    label.textContent = this.i18n.formatDate(date, {
      month: 'short',
      day: 'numeric',
    });
    return label;
  }

  private createAxisText(level: EnergyLevel, y: number): SVGTextElement {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '8');
    text.setAttribute('y', `${y + 4}`);
    text.setAttribute('fill', '#64748b');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '500');
    text.textContent = getEnergyLevelLabel(this.i18n, level);
    return text;
  }

  private createTooltip(): HTMLDivElement {
    const tooltip = document.createElement('div');
    tooltip.className =
      'pointer-events-none absolute hidden min-w-[8rem] rounded-xl border border-slate-200 bg-white/98 px-3 py-2 shadow-lg shadow-slate-900/8';
    tooltip.setAttribute('data-role', 'energy-chart-tooltip');
    return tooltip;
  }

  private showTooltip(
    chartRegion: HTMLDivElement,
    tooltip: HTMLDivElement,
    point: SVGCircleElement,
    entry: { date: Date; record: EnergyRecord }
  ): void {
    const dateText = this.i18n.formatDate(entry.date, {
      month: 'short',
      day: 'numeric',
    });
    const levelText = getEnergyLevelLabel(this.i18n, entry.record.energy);
    tooltip.replaceChildren(
      this.createTooltipLine(dateText, 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400'),
      this.createTooltipLine(levelText, 'mt-1 text-sm font-semibold text-slate-900')
    );
    tooltip.style.display = 'block';

    const regionRect = chartRegion.getBoundingClientRect();
    const pointRect = point.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const centerX = pointRect.left - regionRect.left + pointRect.width / 2;
    const topY = pointRect.top - regionRect.top - 10;
    const clampedLeft = Math.min(
      Math.max(centerX - tooltipRect.width / 2, 8),
      Math.max(regionRect.width - tooltipRect.width - 8, 8)
    );
    const top = Math.max(topY - tooltipRect.height, 8);

    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${top}px`;
  }

  private hideTooltip(tooltip: HTMLDivElement): void {
    tooltip.style.display = 'none';
  }

  private createTooltipLine(text: string, className: string): HTMLParagraphElement {
    const line = document.createElement('p');
    line.className = className;
    line.textContent = text;
    return line;
  }

  private getPeriodOptionLabel(days: (typeof ENERGY_STATS_PERIOD_OPTIONS)[number]): string {
    switch (days) {
      case 7:
        return this.i18n.t('energyStats.period7');
      case 14:
        return this.i18n.t('energyStats.period14');
      case 30:
        return this.i18n.t('energyStats.period30');
    }
  }

  private getDayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
}
