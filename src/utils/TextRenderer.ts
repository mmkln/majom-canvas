// src/utils/TextRenderer.ts

import { FONT_FAMILY } from "../core/constants.ts";

/**
 * Utility class for rendering text on canvas with word wrapping and truncation
 */
export class TextRenderer {
  /**
   * Wraps text to fit within a specified width, returns an array of lines
   *
   * @param ctx Canvas context used for text measurement
   * @param text The text to wrap
   * @param maxWidth Maximum width for each line in pixels
   * @param maxLines Maximum number of lines (truncated with ellipsis if exceeded)
   * @returns Array of text lines
   */
  static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number = 3
  ): string[] {
    // Handle empty text
    if (!text || !text.trim()) {
      return [];
    }

    // Split the text into words
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Process each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Test width with current word added
      const testLine =
        currentLine.length === 0 ? word : currentLine + ' ' + word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth <= maxWidth) {
        // Word fits on current line
        currentLine = testLine;
      } else {
        // Word doesn't fit, start a new line
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        // Handle case where single word is too long for one line
        if (ctx.measureText(word).width > maxWidth) {
          // Word itself is too long for one line, need to break it
          let partialWord = '';
          for (let j = 0; j < word.length; j++) {
            const char = word[j];
            const testPartial = partialWord + char;
            if (ctx.measureText(testPartial).width <= maxWidth) {
              partialWord = testPartial;
            } else {
              if (lines.length < maxLines) {
                lines.push(partialWord);
              }
              partialWord = char;
            }
          }

          // Add any remaining part of the word
          currentLine = partialWord;
        } else {
          // Start a new line with just this word
          currentLine = word;
        }
      }

      // Check if we've reached the maximum number of lines
      if (lines.length >= maxLines) {
        break;
      }
    }

    // Add the last line if there's room
    if (currentLine.length > 0 && lines.length < maxLines) {
      lines.push(currentLine);
    }

    // If we've exceeded our line limit, truncate the last line with ellipsis
    if (
      lines.length > 0 &&
      lines.length >= maxLines &&
      words.length > lines.length
    ) {
      const ellipsis = '...';
      const lastLine = lines[lines.length - 1];

      // Need to truncate to fit ellipsis
      let truncatedLastLine = lastLine;
      while (
        ctx.measureText(truncatedLastLine + ellipsis).width > maxWidth &&
        truncatedLastLine.length > 0
      ) {
        truncatedLastLine = truncatedLastLine.slice(0, -1);
      }

      lines[lines.length - 1] = truncatedLastLine + ellipsis;
    }

    return lines;
  }

  /**
   * Draws multiple lines of text on the canvas
   *
   * @param ctx Canvas context
   * @param lines Array of text lines to draw
   * @param x X-coordinate of the text starting position
   * @param y Y-coordinate of the first line
   * @param lineHeight Vertical distance between lines
   */
  static drawTextLines(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    y: number,
    lineHeight: number
  ): void {
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
  }

  /**
   * Wraps text and draws it directly to the canvas
   * Preserves the current font settings in the context
   *
   * @param ctx Canvas context
   * @param text Text to wrap and draw
   * @param x X-coordinate of the text starting position
   * @param y Y-coordinate of the first line
   * @param maxWidth Maximum width for each line in pixels
   * @param lineHeight Line height multiplier
   * @param maxLines Maximum number of lines (truncated with ellipsis if exceeded)
   * @param fontSize Font size for the text
   * @param fontWeight Font weight for the text
   */
  static drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number = 1.3,
    maxLines: number = 3,
    fontSize: number = 20,
    fontWeight: 'normal' | 'bold' = 'normal'
  ): void {
    // Save current state to preserve font settings
    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`;

    const lines = this.wrapText(ctx, text, maxWidth, maxLines);
    this.drawTextLines(ctx, lines, x, y, fontSize * lineHeight);

    // Restore original state
    ctx.restore();
  }

  /**
   * Returns the height of the wrapped text block in pixels
   *
   * @param ctx Canvas context
   * @param text Text to measure
   * @param maxWidth Maximum width for each line in pixels
   * @param lineHeight Vertical distance between lines
   * @param maxLines Maximum number of lines
   * @returns Height in pixels
   */
  static getWrappedTextHeight(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 3
  ): number {
    const lines = this.wrapText(ctx, text, maxWidth, maxLines);
    return lines.length * lineHeight;
  }
}
