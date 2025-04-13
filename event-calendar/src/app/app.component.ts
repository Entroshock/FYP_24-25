import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CalendarViewComponent],
  template: `
    <div class="app-container">
      <!-- Directly include the calendar component -->
      <app-calendar-view></app-calendar-view>
      
      <!-- Router outlet as fallback -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      width: 100%;
      margin: 0;
      padding: 0;
    }
  `]
})
export class AppComponent {
  title = 'star-rail-events';
}