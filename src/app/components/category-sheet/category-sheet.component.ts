import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonContent, IonFooter, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  bookOutline,
  bulbOutline,
  cartOutline,
  chatbubblesOutline,
  checkmarkCircle,
  closeOutline,
  createOutline,
  documentTextOutline,
  fitnessOutline,
  flaskOutline,
  folderOpenOutline,
  homeOutline,
  laptopOutline,
   layersOutline,
  optionsOutline,
  peopleOutline,
  personOutline,
  pricetagOutline,
  schoolOutline,
  trashOutline,
} from 'ionicons/icons';

import type { CategoryGroup, CategoryItem } from '../../models/activity.model';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../models/activity.model';
import { ActivityStore } from '../../services/activity-store';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-category-sheet',
  templateUrl: 'category-sheet.component.html',
  styleUrls: ['category-sheet.component.scss'],
  imports: [FormsModule, IonContent, IonFooter, IonHeader, IonIcon, IonTitle, IonToolbar],
})
export class CategorySheetComponent implements OnInit {
  @Input() mode: 'select' | 'filter' | 'manage' = 'select';
  @Input() selected = 'Assignments';

  store = inject(ActivityStore);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toast = inject(ToastService);

  view = signal<'list' | 'manage' | 'form'>('list');
  chosen = signal<string>('Assignments');

  // Add/Edit category form state
  editingId = signal<string | null>(null);
  catName = '';
  catGroup: CategoryGroup = 'Academic';
  catIcon = CATEGORY_ICONS[0];
  catColor = CATEGORY_COLORS[0];
  nameError = false;

  icons = CATEGORY_ICONS;
  colors = CATEGORY_COLORS;

  academicCategories = computed(() => this.store.categories().filter((c) => c.group === 'Academic'));
  personalCategories = computed(() => this.store.categories().filter((c) => c.group === 'Personal'));

  constructor() {
    addIcons({
      addOutline,
      bookOutline,
      bulbOutline,
      cartOutline,
      chatbubblesOutline,
      checkmarkCircle,
      closeOutline,
      createOutline,
      documentTextOutline,
      fitnessOutline,
      flaskOutline,
      folderOpenOutline,
      homeOutline,
      laptopOutline,
      layersOutline,
      optionsOutline,
      peopleOutline,
      personOutline,
      pricetagOutline,
      schoolOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    this.chosen.set(this.selected);
    if (this.mode === 'manage') {
      this.view.set('manage');
    }
  }

  get headerTitle(): string {
    if (this.view() === 'form') {
      return this.editingId() ? 'Edit Category' : 'New Category';
    }
    if (this.view() === 'manage') {
      return 'Manage Categories';
    }
    return this.mode === 'filter' ? 'Filter by Category' : 'Select Category';
  }

  pickCategory(name: string): void {
    this.chosen.set(name);
    if (this.mode === 'select') {
      this.modalCtrl.dismiss(name, 'select');
    }
  }

  applyFilter(): void {
    this.modalCtrl.dismiss(this.chosen(), 'filter');
  }

  clearFilter(): void {
    this.chosen.set('all');
    this.modalCtrl.dismiss('all', 'filter');
  }

  openAddCategory(defaultGroup: CategoryGroup = 'Academic'): void {
    this.editingId.set(null);
    this.catName = '';
    this.catGroup = defaultGroup;
    this.catIcon = CATEGORY_ICONS[0];
    this.catColor = CATEGORY_COLORS[0];
    this.nameError = false;
    this.view.set('form');
  }

  openEditCategory(cat: CategoryItem): void {
    this.editingId.set(cat.id);
    this.catName = cat.name;
    this.catGroup = cat.group;
    this.catIcon = cat.icon;
    this.catColor = cat.color;
    this.nameError = false;
    this.view.set('form');
  }

  cancelForm(): void {
    this.view.set(this.mode === 'manage' ? 'manage' : 'list');
  }

  saveCategory(): void {
    const trimmed = this.catName.trim();
    if (!trimmed) {
      this.nameError = true;
      return;
    }
    const editId = this.editingId();
    if (editId) {
      this.store.updateCategory({
        id: editId,
        name: trimmed,
        group: this.catGroup,
        icon: this.catIcon,
        color: this.catColor,
      });
      this.chosen.set(trimmed);
      this.toast.show('Category updated');
      this.view.set('manage');
    } else {
      const created = this.store.addCategory({
        name: trimmed,
        group: this.catGroup,
        icon: this.catIcon,
        color: this.catColor,
      });
      this.chosen.set(created.name);
      this.toast.show(`Category "${created.name}" added`);
      this.view.set(this.mode === 'manage' ? 'manage' : 'list');
    }
  }

  async confirmDeleteCategory(cat: CategoryItem): Promise<void> {
    const usedCount = this.store.countActivitiesUsingCategory(cat.name);
    const message =
      usedCount > 0
        ? `"${cat.name}" is currently used by ${usedCount} sample ${usedCount === 1 ? 'activity' : 'activities'}. Deleting it will reassign ${usedCount === 1 ? 'that activity' : 'those activities'} to "Others".`
        : `Are you sure you want to delete "${cat.name}"?`;

    const alert = await this.alertCtrl.create({
      header: 'Delete Category?',
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.store.deleteCategory(cat.id);
            if (this.chosen() === cat.name) {
              this.chosen.set(this.mode === 'filter' ? 'all' : 'Others');
            }
            this.toast.show(`Category "${cat.name}" deleted`);
          },
        },
      ],
    });
    await alert.present();
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}

