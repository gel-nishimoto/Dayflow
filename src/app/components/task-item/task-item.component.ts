import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, timeOutline } from 'ionicons/icons';

import type { Activity } from '../../models/activity.model';
import { DateLabelPipe, Time12Pipe } from '../../pipes/format.pipes';

@Component({
  selector: 'app-task-item',
  templateUrl: 'task-item.component.html',
  styleUrls: ['task-item.component.scss'],
  imports: [IonIcon, DateLabelPipe, Time12Pipe],
})
export class TaskItemComponent {
  task = input.required<Activity>();
  showDate = input(false);
  // eslint-disable-next-line @angular-eslint/no-output-native
  toggle = output<Activity>();
  openTask = output<Activity>();

  constructor() {
    addIcons({ checkmark, timeOutline });
  }
}
