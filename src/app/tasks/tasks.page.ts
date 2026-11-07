import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonFab, IonFabButton, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, clipboardOutline, closeCircle, funnelOutline } from 'ionicons/icons';

import { CategorySheetComponent } from '../components/category-sheet/category-sheet.component';
import { TaskItemComponent } from '../components/task-item/task-item.component';
import type { ActivityStatus } from '../models/activity.model';
import { ActivityActions } from '../services/activity-actions';
import { ActivityStore } from '../services/activity-store';
import { byDateTime } from '../utils/date-utils';

type StatusFilter = 'all' | ActivityStatus;

@Component({
  selector: 'app-tasks',
  templateUrl: 'tasks.page.html',
  styleUrls: ['tasks.page.scss'],
  imports: [IonContent, IonIcon, IonFab, IonFabButton, TaskItemComponent],
})
export class TasksPage {
  store = inject(ActivityStore);
  actions = inject(ActivityActions);
  private modalCtrl = inject(ModalController);

  filters: StatusFilter[] = ['all', 'pending', 'ongoing', 'completed', 'cancelled'];
  active = signal<StatusFilter>('all');
  selectedCategory = signal<string>('all');

  items = computed(() => {
    const statusFilter = this.active();
    const catFilter = this.selectedCategory();
    const validCategories = new Set(this.store.categories().map((c) => c.name));

    // If the currently filtered category was deleted, fall back to 'all'
    const effectiveCat = catFilter !== 'all' && !validCategories.has(catFilter) ? 'all' : catFilter;

    return this.store
      .activities()
      .filter((a) => (statusFilter === 'all' || a.status === statusFilter) && (effectiveCat === 'all' || a.category === effectiveCat))
      .sort(byDateTime);
  });

  constructor() {
    addIcons({ add, clipboardOutline, funnelOutline, closeCircle });
  }

  async openCategoryFilter(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategorySheetComponent,
      componentProps: { mode: 'filter', selected: this.selectedCategory() },
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss<string>();
    if (role === 'filter' && data) {
      this.selectedCategory.set(data);
    } else if (
      this.selectedCategory() !== 'all' &&
      !this.store.categories().some((c) => c.name === this.selectedCategory())
    ) {
      this.selectedCategory.set('all');
    }
  }

  clearCategoryFilter(event?: Event): void {
    event?.stopPropagation();
    this.selectedCategory.set('all');
  }
}
