import { Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Exercise } from '../../exercise/exercise';
import { ExerciseFile } from '../../exercise/exercise.model';

/** For now: a single hard-coded grid (November 14), browsable move by move. */
const GRID_FILE = '/data/exercices-2026-11-14.json';

@Component({
  selector: 'app-home',
  imports: [Exercise],
  // Exercise screen: never taller than the viewport minus the header (the grid shrinks to fit),
  // but never shorter than 30rem — below that the page scrolls instead of shrinking the grid further.
  host: {
    class:
      'mx-auto flex h-[calc(100dvh-var(--header-height))] min-h-120 w-full max-w-xl flex-col justify-center px-4 py-4 md:landscape:max-w-none md:landscape:pb-10',
    '(document:keydown)': 'onKeydown($event)',
  },
  templateUrl: './home.html',
})
export class Home {
  protected readonly grid = httpResource<ExerciseFile>(() => GRID_FILE);
  protected readonly moveIndex = signal(0);

  protected readonly total = computed(() => this.grid.value()?.exos.length ?? 0);
  protected readonly exo = computed(() => this.grid.value()?.exos[this.moveIndex()]);
  protected readonly hasPrevious = computed(() => this.moveIndex() > 0);
  protected readonly hasNext = computed(() => this.moveIndex() < this.total() - 1);
  /** Width reserved for the move number, so "9 / 20" → "10 / 20" does not shift the line. */
  protected readonly counterWidth = computed(() => String(this.total()).length);

  protected previous(): void {
    if (this.hasPrevious()) this.moveIndex.update((i) => i - 1);
  }

  protected next(): void {
    if (this.hasNext()) this.moveIndex.update((i) => i + 1);
  }

  /** ← / → change move, unless the user is typing or using a shortcut. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.previous();
    } else if (event.key === 'ArrowRight') {
      this.next();
    } else {
      return;
    }
    event.preventDefault();
  }
}
