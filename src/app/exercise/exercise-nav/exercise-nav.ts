import { Component, computed, input, output } from '@angular/core';

/**
 * Navigation between the moves of an exercise: ‹ › buttons, the "name · k / N" line, and the
 * ← → keys. It only shows what it receives and asks the parent to change the move through the
 * `previous` / `next` outputs.
 */
@Component({
  selector: 'app-exercise-nav',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  templateUrl: './exercise-nav.html',
})
export class ExerciseNav {
  /** Name of the exercise (its grid date). */
  readonly name = input.required<string>();
  /** Number of the current move, as shown to the user (1 = first move). */
  readonly moveNumber = input.required<number>();
  readonly moveCount = input.required<number>();
  readonly hasPrevious = input.required<boolean>();
  readonly hasNext = input.required<boolean>();

  readonly previous = output();
  readonly next = output();

  /** Width reserved for the move number, so "9 / 20" → "10 / 20" does not shift the line. */
  protected readonly moveNumberWidth = computed(() => String(this.moveCount()).length);

  /** ← / → go to the previous / next move. */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.shouldIgnoreKey(event)) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      // The arrow would otherwise scroll the page sideways.
      event.preventDefault();
      this.previous.emit();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next.emit();
      return;
    }
  }

  /** Keys that belong to someone else and must not change the move. */
  private shouldIgnoreKey(event: KeyboardEvent): boolean {
    // Already handled by another element of the page.
    if (event.defaultPrevented) {
      return true;
    }
    // Arrows combined with a modifier are browser or system shortcuts:
    // Alt+← / Alt+→ go back / forward in the browser history,
    // Shift / Ctrl / Cmd + arrows select text or jump by word.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return true;
    }
    // In a form field the arrows move the text cursor.
    if (this.isTypingInFormField(event)) {
      return true;
    }
    return false;
  }

  /**
   * True when the key was pressed inside a form field (input, textarea, select or an editable
   * element), where the user is typing and the arrows must keep moving the text cursor.
   */
  private isTypingInFormField(event: KeyboardEvent): boolean {
    const target = event.target;
    return (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]') !== null
    );
  }
}
