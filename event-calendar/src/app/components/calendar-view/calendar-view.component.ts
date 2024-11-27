// Import necessary modules and types
import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventInput } from '@fullcalendar/core';

import {
  EventClickArg,
  EventMountArg,
  EventContentArg
} from '@fullcalendar/core';

// Define our event data structure to match Firestore
interface GameEvent {
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTimestamp: number;
  endTimestamp: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-wrapper">
      <!-- Event type filters -->
      <div class="filters" *ngIf="!loading">
        <h3>Event Types</h3>
        <div class="filter-buttons">
          <button 
            *ngFor="let type of eventTypes" 
            (click)="toggleEventType(type)"
            [class.active]="isEventTypeActive(type)"
            [style.background-color]="getEventColor(type)">
            {{ type }}
          </button>
        </div>
      </div>

      <!-- Calendar container with loading state -->
      <div class="calendar-container">
        <div *ngIf="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Loading calendar...</p>
        </div>
        <div id="calendar"></div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-wrapper {
      margin: 20px;
    }

    .filters {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .filters h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .filter-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-buttons button {
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      color: white;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .filter-buttons button:not(.active) {
      opacity: 0.6;
    }

    .filter-buttons button:hover {
      opacity: 1;
    }

    .calendar-container {
      position: relative;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-height: 800px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  // Component state
  private isBrowser: boolean;
  loading = true;
  private calendar: any;
  private eventSubscription?: Subscription;

  // Event management
  eventTypes = ['Warp', 'Garden of Plenty', 'Planar', 'Other'];
  activeEventTypes = new Set(this.eventTypes);
  private eventsSubject = new BehaviorSubject<GameEvent[]>([]);

  constructor(
    private firestore: Firestore,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      try {
        // Dynamically import FullCalendar and its plugins
        const [
          { Calendar }, 
          { default: dayGridPlugin },
          { default: timeGridPlugin },
          { default: listPlugin },
          { default: interactionPlugin }
        ] = await Promise.all([
          import('@fullcalendar/core'),
          import('@fullcalendar/daygrid'),
          import('@fullcalendar/timegrid'),
          import('@fullcalendar/list'),
          import('@fullcalendar/interaction')
        ]);

        // Initialize calendar with imported plugins
        this.initializeCalendar(Calendar, [
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin
        ]);
        
        // Start loading events after calendar is ready
        this.loadEvents();
      } catch (error) {
        console.error('Failed to load calendar:', error);
        this.loading = false;
      }
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions and calendar instance
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
    if (this.calendar) {
      this.calendar.destroy();
    }
  }

  private initializeCalendar(Calendar: any, plugins: any[]) {
    const calendarEl = document.querySelector('#calendar');
    if (calendarEl) {
      this.calendar = new Calendar(calendarEl, {
        plugins,
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        events: [],
        // Now with proper typing
        eventClick: (info: EventClickArg) => this.handleEventClick(info),
        eventDidMount: (info: EventMountArg) => {
          info.el.title = info.event.extendedProps['description'] || info.event.title;
        },
        eventContent: (info: EventContentArg) => ({
          html: `
            <div style="padding: 3px;">
              <div style="font-weight: bold;">${info.event.title}</div>
              <div style="font-size: 0.8em;">${this.formatTime(info.event.start!)}</div>
            </div>
          `
        })
      });
  
      this.calendar.render();
    }
  }

  loadEvents() {
    const eventsCollection = collection(this.firestore, 'events');
    this.eventSubscription = collectionData(eventsCollection).pipe(
      map(events => events as GameEvent[])
    ).subscribe({
      next: (events) => {
        this.loading = false;
        this.eventsSubject.next(events);
        this.updateCalendarEvents();
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });
  }

  updateCalendarEvents() {
    if (!this.calendar) return;

    const events = this.eventsSubject.value;
    const filteredEvents = events.filter(event => {
      const type = this.getEventType(event.title);
      return this.activeEventTypes.has(type);
    });
    
    const calendarEvents = this.convertToCalendarEvents(filteredEvents);
    this.calendar.removeAllEvents();
    this.calendar.addEventSource(calendarEvents);
  }

  getEventType(title: string): string {
    if (title.includes('Warp')) return 'Warp';
    if (title.includes('Garden of Plenty')) return 'Garden of Plenty';
    if (title.includes('Planar')) return 'Planar';
    return 'Other';
  }

  toggleEventType(type: string) {
    if (this.activeEventTypes.has(type)) {
      this.activeEventTypes.delete(type);
    } else {
      this.activeEventTypes.add(type);
    }
    this.updateCalendarEvents();
  }

  isEventTypeActive(type: string): boolean {
    return this.activeEventTypes.has(type);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  convertToCalendarEvents(events: GameEvent[]): EventInput[] {
    return events.map(event => ({
      id: event.eventId,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      description: event.description,
      allDay: false,
      backgroundColor: this.getEventColor(this.getEventType(event.title)),
      borderColor: this.getEventColor(this.getEventType(event.title))
    }));
  }

  getEventColor(type: string): string {
    switch (type) {
      case 'Warp': return '#e91e63';
      case 'Garden of Plenty': return '#4caf50';
      case 'Planar': return '#2196f3';
      default: return '#9c27b0';
    }
  }

  handleEventClick(info: EventClickArg) {
    const startDate = new Date(info.event.start!).toLocaleString();
    const endDate = new Date(info.event.end!).toLocaleString();
    
    const eventDetails = `
      ${info.event.title}
      
      From: ${startDate}
      To: ${endDate}
      
      ${info.event.extendedProps['description']}
    `;
    
    alert(eventDetails);
  }
}