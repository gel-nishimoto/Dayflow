import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-card',
  templateUrl: 'progress-card.component.html',
  styleUrls: ['progress-card.component.scss'],
})
export class ProgressCardComponent {
  done = input.required<number>();
  total = input.required<number>();

  percent = computed(() => (this.total() ? Math.round((this.done() / this.total()) * 100) : 0));
}

