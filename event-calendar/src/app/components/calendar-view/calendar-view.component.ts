import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventInput } from '@fullcalendar/core';


import {
  EventClickArg,
  EventMountArg,
  EventContentArg,
  MoreLinkArg
} from '@fullcalendar/core';

import { EventModalComponent } from './event-modal.component';

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
  sentiment: 'positive' | 'neutral' | 'negative';
  imageUrl?: string; // Add optional image URL property
}
@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, EventModalComponent], // Import the modal component
  // Update the calendar-view.component.ts template
template: `
<div class="page-container">
  <h1 class="page-title">Honkai: Star Rail Events</h1>
  
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
    
    <!-- Use the event modal component with imageUrl -->
    <app-event-modal
      [isVisible]="showEventModal"
      [title]="selectedEvent.title"
      [eventType]="selectedEvent.type"
      [typeColor]="getEventColor(selectedEvent.type)"
      [sentiment]="selectedEvent.sentiment"
      [sentimentColor]="getSentimentColor(selectedEvent.sentiment)"
      [sentimentIcon]="getSentimentIcon(selectedEvent.sentiment)"
      [startDate]="selectedEvent.startDate"
      [endDate]="selectedEvent.endDate"
      [description]="selectedEvent.description"
      [imageUrl]="selectedEvent.imageUrl"
      (closeModal)="closeEventModal()">
    </app-event-modal>
  </div>
</div>
`,
styles: [`
.page-container {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

.page-title {
  text-align: center;
  color: #ffffff;
  margin: 20px 0;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(66, 133, 244, 0.3);
  letter-spacing: 1px;
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(66, 133, 244, 0.3); }
  50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.7), 0 0 30px rgba(66, 133, 244, 0.5); }
  100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(66, 133, 244, 0.3); }
}

.calendar-wrapper {
  padding: 0 20px 40px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.filters h3 {
  margin: 0 0 10px 0;
  color: #ffffff;
  font-weight: 600;
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
  transition: all 0.2s;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.filter-buttons button:not(.active) {
  opacity: 0.6;
}

.filter-buttons button:hover {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.filter-buttons button.active {
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4);
}

.calendar-container {
  position: relative;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.5);
  min-height: 800px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(3px);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid #e6e6e6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-overlay p {
  margin-top: 15px;
  color: #ffffff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* FullCalendar Theming for Dark Space Background */
:host ::ng-deep .fc {
  --fc-border-color: rgba(255, 255, 255, 0.15);
  --fc-today-bg-color: rgba(66, 133, 244, 0.15);
  --fc-neutral-bg-color: rgba(255, 255, 255, 0.05);
  --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.1);
  --fc-page-bg-color: transparent;
}

:host ::ng-deep .fc-theme-standard td, 
:host ::ng-deep .fc-theme-standard th,
:host ::ng-deep .fc-theme-standard .fc-scrollgrid {
  border-color: rgba(255, 255, 255, 0.15);
}

:host ::ng-deep .fc-col-header-cell-cushion,
:host ::ng-deep .fc-daygrid-day-number,
:host ::ng-deep .fc-toolbar-title {
  font-weight: 700;
  font-size: 1.5em !important;
  color: #ffffff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

:host ::ng-deep .fc-button-primary {
  background-color: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.3);
}

:host ::ng-deep .fc-button-primary:hover {
  background-color: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.5);
}

:host ::ng-deep .fc-button-primary:not(:disabled).fc-button-active,
:host ::ng-deep .fc-button-primary:not(:disabled):active {
  background-color: rgba(66, 133, 244, 0.8);
  border-color: rgba(66, 133, 244, 0.8);
}

:host ::ng-deep .fc-daygrid-day-frame {
  min-height: 80px;
  background-color: rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s;
}

:host ::ng-deep .fc-daygrid-day-frame:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

:host ::ng-deep .fc-day-today .fc-daygrid-day-frame {
  background-color: rgba(66, 133, 244, 0.15);
}

:host ::ng-deep .fc-daygrid-day-top {
  justify-content: center;
  margin-bottom: 5px;
}

:host ::ng-deep .fc-daygrid-day-number {
  font-weight: 500;
  font-size: 14px;
  padding: 4px;
}

:host ::ng-deep .fc-day-today .fc-daygrid-day-number {
  background-color:rgb(0, 0, 0);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Event styling */
:host ::ng-deep .fc-event {
  border-radius: 4px;
  overflow: hidden;
  border: none !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  margin-bottom: 1px !important;
  transition: transform 0.15s, box-shadow 0.15s;
}

:host ::ng-deep .fc-event:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 5px rgba(255, 255, 255, 0.2);
  z-index: 10;
}

/* Base popover styling */
:host ::ng-deep .fc-popover {
  background: rgba(10, 10, 15, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
  max-width: 350px !important;
  backdrop-filter: blur(10px) !important;
  /* Remove the transform that might conflict with dragging */
  /* transform: translateX(20%) !important; */
  z-index: 100 !important;
  overflow: hidden !important; /* Keeps content inside rounded corners */
  transition: box-shadow 0.2s ease !important;
}

/* Styles for when the popover is being dragged */
:host ::ng-deep .fc-popover.dragging {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7) !important;
  opacity: 0.95 !important;
  transition: none !important;
  cursor: grabbing !important;
}

/* Header styling - make it look more like a drag handle */
:host ::ng-deep .fc-popover-header {
  padding: 10px 12px !important;
  background: linear-gradient(to bottom, rgba(80, 100, 180, 0.9), rgba(60, 80, 160, 0.9)) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
  display: flex !important;
  align-items: center !important;
  cursor: move !important;
}


/* Better appearance for drag handle */
:host ::ng-deep .drag-handle {
  cursor: move;
  font-size: 16px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

:host ::ng-deep .fc-popover-header:hover .drag-handle {
  opacity: 1;
}

/* Better styling for popover content */
:host ::ng-deep .fc-popover-body {
  padding: 12px !important;
  max-height: 400px !important;
  overflow-y: auto !important;
}

/* Improved styling for more link to create popover */
:host ::ng-deep .fc-daygrid-more-link {
  background-color: rgba(80, 110, 200, 0.8) !important;
  color: white !important;
  padding: 3px 10px !important;
  border-radius: 12px !important;
  margin: 3px 0 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  text-align: center !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.2s ease !important;
}

:host ::ng-deep .fc-daygrid-more-link:hover {
  background-color: rgba(100, 130, 220, 0.9) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4) !important;
}

@media (max-width: 768px) {
  .page-container {
    padding: 0;
  }
  
  .calendar-wrapper {
    padding: 0 10px 20px;
  }
  
  .calendar-container {
    padding: 10px;
  }
  
  .page-title {
    font-size: 24px;
    margin: 15px 0;
  }
}
`]
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  // Component state
  private isBrowser: boolean;
  loading = true;
  private calendar: any;
  private eventSubscription?: Subscription;
  private dateDropdownOpen = false;
  private popoverObserver: MutationObserver | null = null;

  // Event management
  eventTypes = ['Warp', 'Garden of Plenty', 'Planar', 'Other'];
  activeEventTypes = new Set(this.eventTypes);
  private eventsSubject = new BehaviorSubject<GameEvent[]>([]);
  
  // Modal state
  showEventModal = false;
  
  selectedEvent: {
    title: string;
    type: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    startDate: string;
    endDate: string;
    description: string;
    imageUrl: string; // Add image URL property
  } = {
    title: '',
    type: '',
    sentiment: 'neutral',
    startDate: '',
    endDate: '',
    description: '',
    imageUrl: '' // Initialize as empty string
  };

  constructor(
    private firestore: Firestore,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    if (this.isBrowser) {
      try {
        // This Dynamically imports FullCalendar and its plugins
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
        
        // After calendar is initialized, set up popover handling
        this.setupPopoverHandling();
        
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
    if (this.popoverObserver) {
      this.popoverObserver.disconnect();
    }
  }

  // New method to enhance popover with dragging and positioning
  private enhancePopover(popover: HTMLElement) {
    // First, make sure the popover has the right initial styles
    popover.style.position = 'absolute';
    popover.style.zIndex = '2000'; // Higher z-index during interaction
    
    // Remove any transform from CSS that might conflict
    popover.style.transform = 'none';
    
    // Get initial position
    const initialLeft = popover.offsetLeft;
    const initialTop = popover.offsetTop;
    
    // Move it to the right by a fixed amount (adjust as needed)
    popover.style.left = (initialLeft + 50) + 'px';
    
    // Make sure we're not too close to the edge
    const rightEdge = initialLeft + popover.offsetWidth + 50;
    const viewportWidth = window.innerWidth;
    
    if (rightEdge > viewportWidth - 20) {
      // If too close to the right edge, place it to the left instead
      popover.style.left = (initialLeft - 50) + 'px';
    }
    
    // Make the header draggable
    const header = popover.querySelector('.fc-popover-header') as HTMLElement;
    if (!header) return;
    
    // Style the header to indicate it's draggable
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    
    // Add a visual drag handle indicator if not already present
    if (!header.querySelector('.drag-handle')) {
      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '&#9776;'; // Hamburger icon
      dragHandle.style.marginRight = '5px';
      dragHandle.style.color = 'rgba(255, 255, 255, 0.7)';
      
      const title = header.querySelector('.fc-popover-title');
      if (title && title.parentNode) {
        title.parentNode.insertBefore(dragHandle, title);
      }
    }
    
    // Variables to track dragging
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let originalX = 0;
    let originalY = 0;
    
    const mouseDownHandler = (e: MouseEvent) => {
      // Only allow dragging from the header
      if (!header.contains(e.target as Node)) return;
      
      // Start dragging
      isDragging = true;
      
      // Store the initial position
      startX = e.clientX;
      startY = e.clientY;
      originalX = popover.offsetLeft;
      originalY = popover.offsetTop;
      
      // Add a dragging class for visual feedback
      popover.classList.add('dragging');
      
      // Increase z-index during drag
      const oldZIndex = popover.style.zIndex;
      popover.style.zIndex = '3000';
      
      // Disable transitions during drag for smoother movement
      popover.style.transition = 'none';
      
      // Prevent text selection during drag
      e.preventDefault();
      
      // Set up temporary mousemove and mouseup handlers
      const mouseMoveHandler = (e: MouseEvent) => {
        if (!isDragging) return;
        
        // Calculate distance moved
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // Update position
        popover.style.left = (originalX + dx) + 'px';
        popover.style.top = (originalY + dy) + 'px';
      };
      
      const mouseUpHandler = () => {
        if (!isDragging) return;
        
        // Stop dragging
        isDragging = false;
        
        // Remove dragging class
        popover.classList.remove('dragging');
        
        // Restore z-index
        popover.style.zIndex = oldZIndex;
        
        // Re-enable transitions
        popover.style.transition = 'box-shadow 0.2s ease';
      
        // Remove the temporary handlers
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
      
      // Add the temporary handlers
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };
    
    // Add mouse down handler to header
    header.addEventListener('mousedown', mouseDownHandler);
    
    // Clean up when popover is closed
    const closeButton = popover.querySelector('.fc-popover-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        header.removeEventListener('mousedown', mouseDownHandler);
      });
    }
  }

  // New method for handling popovers using MutationObserver
  private setupPopoverHandling() {
    // Listen for the popover's appearance
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const popovers = document.querySelectorAll('.fc-popover');
          Array.from(popovers).forEach(popover => {
            // Check if we've already processed this popover
            if (!(popover as HTMLElement).dataset['enhanced']) {
              this.enhancePopover(popover as HTMLElement);
              // Mark as enhanced to avoid duplicate processing
              (popover as HTMLElement).dataset['enhanced'] = 'true';
            }
          });
        }
      }
    });
    
    // Start observing the document body
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Store the observer for cleanup
    this.popoverObserver = observer;
  }

  // Updated initializeCalendar method with fixed event click handler
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
        dayMaxEvents: 2, // Show only 2 events before "more" link
        events: [],
        eventTimeFormat: { // Customize the time display
          hour: '2-digit',
          minute: '2-digit',
          meridiem: 'short'
        },
        
        // Fixed event click handler
        eventClick: (info: EventClickArg) => {
          // Prevent default behavior first
          info.jsEvent.preventDefault();
          
          // Handle the event click
          this.handleEventClick(info);
          
          return false; // Ensure default browser behavior is prevented
        },
        
        // Improved more link styling and positioning
        moreLinkContent: (args: any) => {
          return {
            html: `<div class="custom-more-link">+${args.num} more</div>`
          };
        },
        
        eventDidMount: (info: EventMountArg) => {
          // Improved tooltip handling
          const tooltip = info.event.extendedProps['description'] || info.event.title;
          info.el.setAttribute('data-tooltip', tooltip);
        },
        
        eventContent: (info: EventContentArg) => this.renderEventContent(info)
      });

      this.calendar.render();
    }
  }

  renderEventContent(info: EventContentArg): { html: string } {
    const type = this.getEventType(info.event.title.replace(' (Start)', '').replace(' (End)', ''));
    const sentiment = info.event.extendedProps['sentiment'] || 'neutral';
    const sentimentIcon = this.getSentimentIcon(sentiment);
    
    // Determine if this is a start or end event
    const isStartEvent = info.event.extendedProps['isStartEvent'] || false;
    const isEndEvent = info.event.extendedProps['isEndEvent'] || false;
    
    // Get the base event title without the (Start) or (End) suffix
    const baseTitle = info.event.title
      .replace(' (Start)', '')
      .replace(' (End)', '');
    
    // Adjust title length based on view type
    let maxTitleLength = 15; // Shorter default for start/end labels
    
    if (info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay') {
      maxTitleLength = 22;
    } else if (info.view.type === 'listWeek') {
      maxTitleLength = 100; // No truncation needed for list view
    }
  
    // Color the entire event background based on type
    const bgColor = this.getEventColor(type);
    const sentimentBgColor = this.getSentimentBgColor(sentiment);
    
    // Create a visual indicator for start or end
    const indicator = isStartEvent ? '▶ Start' : (isEndEvent ? '⏹ End' : '');
    
    // Create a clean structured event with header bar and content
    return {
      html: `
        <div class="event-container" style="background-color: ${bgColor};">
          <div class="event-header">
            <span class="event-title-text">${this.truncateTitle(baseTitle, maxTitleLength)}</span>
            <span class="event-sentiment" style="background-color: ${sentimentBgColor};">${sentimentIcon}</span>
          </div>
          <div class="event-content">
            <div class="event-time"><b>${indicator}</b></div>
          </div>
        </div>
      `
    };
  }

  truncateTitle(title: string, maxLength: number): string {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
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
    const calendarEvents: EventInput[] = [];
    
    events.forEach(event => {
      const type = this.getEventType(event.title);
      const baseColor = this.getEventColor(type);
      
      // Common extended props for both events
      const commonProps = {
        sentiment: event.sentiment,
        type: type,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        imageUrl: event.imageUrl || '',
        relatedEventId: event.eventId
      };
      
      // Create an event for the start date
      calendarEvents.push({
        id: `${event.eventId}-start`,
        title: `${event.title} (Start)`,
        start: event.startDate,
        allDay: true,
        backgroundColor: baseColor,
        borderColor: baseColor,
        textColor: '#FFFFFF',
        extendedProps: {
          ...commonProps,
          isStartEvent: true
        }
      });
      
      // Create an event for the end date
      calendarEvents.push({
        id: `${event.eventId}-end`,
        title: `${event.title} (End)`,
        start: event.endDate,
        allDay: true,
        backgroundColor: baseColor,
        borderColor: baseColor,
        textColor: '#FFFFFF',
        extendedProps: {
          ...commonProps,
          isEndEvent: true
        }
      });
    });
    
    return calendarEvents;
  }

  getEventColor(type: string): string {
    switch (type) {
      case 'Warp': return '#e91e63';  // Vibrant pink/red
      case 'Garden of Plenty': return '#4caf50';  // Green
      case 'Planar': return '#2196f3';  // Blue
      default: return '#9c27b0';  // Purple
    }
  }
  
  getSentimentClassName(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      default: return 'sentiment-neutral';
    }
  }
  
  // Helper methods for sentiment styling
  getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return '✓';
      case 'negative':
        return '×'; // Using the multiplication symbol which is more consistently centered
      default:
        return '⚪'; // Using a white circle which is more consistently centered
    }
  }
  
  // Add a new method for sentiment background colors
  getSentimentBgColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return 'rgba(76, 175, 80, 0.7)'; // Green with opacity
      case 'negative':
        return 'rgba(244, 67, 54, 0.7)'; // Red with opacity
      default:
        return 'rgba(158, 158, 158, 0.5)'; // Gray for neutral with opacity
    }
  }
  
  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return '#4caf50'; // Green
      case 'negative':
        return '#f44336'; // Red
      default:
        return '#757575'; // Gray for neutral
    }
  }
  
  // Updated handleEventClick method to ensure modal starts at the top
  handleEventClick(info: EventClickArg) {
    const eventType = info.event.extendedProps['type'] || this.getEventType(info.event.title);
    const sentiment = info.event.extendedProps['sentiment'] || 'neutral';
    
    // Format dates properly from the extended props
    const startDate = new Date(info.event.extendedProps['startDate']).toLocaleString();
    const endDate = new Date(info.event.extendedProps['endDate']).toLocaleString();
    
    // Get the base event title without the (Start) or (End) suffix
    const baseTitle = info.event.title
      .replace(' (Start)', '')
      .replace(' (End)', '');
    
    // Update the selected event object with all properties including imageUrl
    this.selectedEvent = {
      title: baseTitle,
      type: eventType,
      sentiment: sentiment as 'positive' | 'neutral' | 'negative',
      startDate: startDate,
      endDate: endDate,
      description: info.event.extendedProps['description'] || 'No description available.',
      imageUrl: info.event.extendedProps['imageUrl'] || ''
    };
    
    // Show the modal
    this.showEventModal = true;
    
    // Ensure any popovers are closed
    if (this.calendar && typeof this.calendar.el.querySelectorAll === 'function') {
      const popovers = this.calendar.el.querySelectorAll('.fc-popover');
      if (popovers.length > 0) {
        popovers.forEach((popover: HTMLElement) => {
          popover.style.display = 'none';
        });
      }
    }
  }
  
  closeEventModal() {
    this.showEventModal = false;
  }
  
  closeModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('event-modal')) {
      this.closeEventModal();
    }
  }
}