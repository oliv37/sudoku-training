import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgOptimizedImage],
  template: `
    <!-- Fixed height (--header-height) so pages can size themselves against the viewport. -->
    <header class="flex h-(--header-height) w-full items-center gap-2 px-4">
      <img ngSrc="sudoku-training-logo.svg" width="32" height="32" alt="" priority />
      <p class="flex gap-[0.3em] font-display text-xl font-extrabold tracking-wider uppercase">
        <span class="text-navy">Sudoku</span><span class="text-hyp">Training</span>
      </p>
    </header>
    <main>
      <h1 class="sr-only">Sudoku Training</h1>
      <router-outlet />
    </main>
  `,
})
export class App {}
