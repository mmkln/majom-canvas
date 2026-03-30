import type { Tag } from '../../../../majom-wrapper/interfaces/index.ts';

export type ExistingGoalPickerQueryRequest = {
  term: string;
  tagIds: number[];
};

export type ExistingGoalPickerQuerySnapshot = {
  inputValue: string;
  term: string;
  activeTagIds: number[];
  selectedTags: Tag[];
  suggestedTags: Tag[];
  pendingHashQuery: string | null;
  pendingExactTagId: number | null;
  hasActiveQuery: boolean;
  tagsLoading: boolean;
  tagsLoadFailed: boolean;
  showStateMessage: boolean;
};

const MAX_SUGGESTED_TAGS = 6;

export class ExistingGoalPickerQueryModel {
  private inputValue = '';
  private activeTagIds: number[] = [];
  private availableTags: Tag[] = [];
  private tagsLoading = false;
  private tagsLoadFailed = false;

  public reset(): void {
    this.inputValue = '';
    this.activeTagIds = [];
    this.availableTags = [];
    this.tagsLoading = false;
    this.tagsLoadFailed = false;
  }

  public setInputValue(value: string): void {
    this.inputValue = value;
  }

  public startTagLoading(): void {
    this.availableTags = [];
    this.tagsLoading = true;
    this.tagsLoadFailed = false;
  }

  public resolveTags(tags: Tag[]): void {
    this.availableTags = [...tags];
    this.tagsLoading = false;
    this.tagsLoadFailed = false;
  }

  public failTags(): void {
    this.availableTags = [];
    this.tagsLoading = false;
    this.tagsLoadFailed = true;
  }

  public commitInput(mode: 'auto' | 'explicit' = 'explicit'): ExistingGoalPickerQueryRequest {
    const consumed = this.consumeResolvedHashTokens(
      this.inputValue,
      mode === 'explicit'
    );
    if (mode === 'explicit') {
      this.inputValue = this.normalizeCommittedInput(consumed.nextInput, false);
    } else if (consumed.resolvedTagIds.length > 0) {
      this.inputValue = this.normalizeCommittedInput(
        consumed.nextInput,
        /\s$/.test(this.inputValue)
      );
    }
    this.activeTagIds = this.mergeActiveTagIds(consumed.resolvedTagIds);
    return this.getRequest();
  }

  public applySuggestedTag(tagId: number): ExistingGoalPickerQueryRequest {
    if (!this.activeTagIds.includes(tagId)) {
      this.activeTagIds = [...this.activeTagIds, tagId];
    }
    this.inputValue = this.replacePendingHashFragment(this.inputValue, tagId);
    return this.getRequest();
  }

  public removeTag(tagId: number): ExistingGoalPickerQueryRequest {
    this.activeTagIds = this.activeTagIds.filter((id) => id !== tagId);
    return this.getRequest();
  }

  public clearTags(): ExistingGoalPickerQueryRequest {
    this.activeTagIds = [];
    return this.getRequest();
  }

  public clearText(): ExistingGoalPickerQueryRequest {
    this.inputValue = '';
    return this.getRequest();
  }

  public clearAll(): ExistingGoalPickerQueryRequest {
    this.inputValue = '';
    this.activeTagIds = [];
    return this.getRequest();
  }

  public getRequest(): ExistingGoalPickerQueryRequest {
    const term = this.buildSearchTerm(this.inputValue);
    return {
      term,
      tagIds: [...this.activeTagIds],
    };
  }

  public getSnapshot(): ExistingGoalPickerQuerySnapshot {
    const term = this.buildSearchTerm(this.inputValue);
    const selectedTags = this.availableTags.filter((tag) =>
      this.activeTagIds.includes(tag.id)
    );
    const pendingHashQuery = this.getPendingHashQuery(this.inputValue);
    const pendingExactTagId = pendingHashQuery
      ? this.findTagBySlug(pendingHashQuery)?.id ?? null
      : null;
    const suggestedTags = pendingHashQuery
      ? this.availableTags
        .filter(
          (tag) =>
            !this.activeTagIds.includes(tag.id) &&
            this.getTagSuggestionRank(tag, pendingHashQuery) !==
              Number.POSITIVE_INFINITY
        )
        .sort((left, right) => {
          const rankDiff =
            this.getTagSuggestionRank(left, pendingHashQuery) -
            this.getTagSuggestionRank(right, pendingHashQuery);
          if (rankDiff !== 0) return rankDiff;
          return left.title.localeCompare(right.title);
        })
        .slice(0, MAX_SUGGESTED_TAGS)
      : [];

    const showStateMessage = this.tagsLoading || this.tagsLoadFailed;

    return {
      inputValue: this.inputValue,
      term,
      activeTagIds: [...this.activeTagIds],
      selectedTags,
      suggestedTags,
      pendingHashQuery,
      pendingExactTagId,
      hasActiveQuery: term.length > 0 || selectedTags.length > 0,
      tagsLoading: this.tagsLoading,
      tagsLoadFailed: this.tagsLoadFailed,
      showStateMessage,
    };
  }

  public findTagById(tagId: number): Tag | undefined {
    return this.availableTags.find((tag) => tag.id === tagId);
  }

  private buildSearchTerm(input: string): string {
    return input
      .replace(/(^|\s)#[^\s#]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getPendingHashQuery(input: string): string | null {
    const matches = this.collectHashMatches(input);
    if (matches.length === 0) return null;
    const fragment = matches[matches.length - 1]?.slug.trim().toLowerCase() ?? '';
    if (!fragment) return null;
    return fragment;
  }

  private consumeResolvedHashTokens(
    input: string,
    includeTrailingMatch: boolean
  ): {
    nextInput: string;
    resolvedTagIds: number[];
  } {
    const resolvedTagIds: number[] = [];
    const nextInput = input.replace(
      /(^|\s)#([^\s#]+)/g,
      (full, prefix, rawSlug, offset: number) => {
        const slug = String(rawSlug).trim().toLowerCase();
        const match = this.findTagBySlug(slug);
        if (!match) return full;
        const end = offset + String(full).length;
        const isTrailingMatch = end === input.length;
        if (isTrailingMatch && !includeTrailingMatch) {
          return full;
        }
        resolvedTagIds.push(match.id);
        return prefix || ' ';
      }
    );

    return {
      nextInput,
      resolvedTagIds,
    };
  }

  private normalizeCommittedInput(
    input: string,
    preserveTrailingSpace: boolean
  ): string {
    const normalized = input.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return preserveTrailingSpace ? `${normalized} ` : normalized;
  }

  private replacePendingHashFragment(input: string, tagId: number): string {
    const tag = this.findTagById(tagId);
    if (!tag) return input.trim();

    const matches = this.collectHashMatches(input);
    if (matches.length === 0) return input.trim();
    const match = matches[matches.length - 1];
    if (!match) return input.trim();

    const start = match.index + match.prefix.length;
    const end = start + (match.rawMatch.length - match.prefix.length);
    const next =
      input.slice(0, start) +
      input.slice(end);

    return next.replace(/\s+/g, ' ').trim();
  }

  private collectHashMatches(input: string): Array<{
    index: number;
    prefix: string;
    slug: string;
    rawMatch: string;
  }> {
    const matches: Array<{
      index: number;
      prefix: string;
      slug: string;
      rawMatch: string;
    }> = [];
    const regex = /(^|\s)#([^\s#]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      matches.push({
        index: match.index,
        prefix: match[1] ?? '',
        slug: match[2] ?? '',
        rawMatch: match[0] ?? '',
      });
    }
    return matches;
  }

  private mergeActiveTagIds(nextIds: number[]): number[] {
    return [...new Set([...this.activeTagIds, ...nextIds])];
  }

  private findTagBySlug(slug: string): Tag | undefined {
    const normalized = slug.trim().toLowerCase();
    return this.availableTags.find((tag) => tag.slug.toLowerCase() === normalized);
  }

  private getTagSuggestionRank(tag: Tag, rawTerm: string): number {
    const term = rawTerm.trim().toLowerCase();
    if (!term) return Number.POSITIVE_INFINITY;

    const title = tag.title.toLowerCase();
    const slug = tag.slug.toLowerCase();

    if (slug === term) return 0;
    if (slug.startsWith(term)) return 1;
    if (title.startsWith(term)) return 2;
    if (slug.includes(term)) return 3;
    if (title.includes(term)) return 4;
    return Number.POSITIVE_INFINITY;
  }
}
