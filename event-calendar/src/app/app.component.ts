// src/app/app.component.ts
import { Component } from '@angular/core';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalendarViewComponent],
  template: `
    <main>
      <h1>Honkai: Star Rail Events</h1>
      <app-calendar-view></app-calendar-view>
    </main>
  `,
  styles: [`
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }
  `]
})
export class AppComponent {
  title: any;
}