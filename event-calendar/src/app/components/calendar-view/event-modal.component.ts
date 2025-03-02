// event-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="event-modal" [class.active]="isVisible" (click)="closeOnBackdrop($event)">
    <div class="event-modal-content">
      <span class="close-modal" (click)="close()">&times;</span>
      
      <!-- Event Title -->
      <h2 class="event-title">{{ title }}</h2>
      
      <!-- Event Type and Sentiment -->
      <div class="event-meta">
        <span 
          class="event-type-badge" 
          [style.background-color]="typeColor">
          {{ eventType }}
        </span>
        <span 
          class="event-sentiment" 
          [style.color]="sentimentColor">
          <span class="sentiment-icon">{{ sentimentIcon }}</span>
          {{ sentimentText }}
        </span>
      </div>
      
      <!-- Event Dates -->
      <div class="event-dates">
        <div><strong>Start:</strong> {{ startDate }}</div>
        <div><strong>End:</strong> {{ endDate }}</div>
      </div>
      
      <!-- Event Description -->
      <h3 class="description-title">Description</h3>
      <div class="description-content">{{ description }}</div>
    </div>
  </div>
`,
  styles: [`
    .event-modal {
      display: none;
      position: fixed;
      z-index: 1001;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.3);
    }
  
    .event-modal.active {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  
    .event-modal-content {
      background-color: #fff;
      margin: auto;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
      position: relative;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      max-height: 85vh;
      overflow-y: auto;
    }
  
    .close-modal {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 24px;
      font-weight: normal;
      cursor: pointer;
      color: #aaa;
    }
  
    .close-modal:hover {
      color: #555;
    }
  
    .event-title {
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
    }
  
    .event-meta {
      margin-bottom: 15px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 25px; /* Increase gap between badge and sentiment */
    }
  
    .event-type-badge {
      display: inline-block;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 14px;
      min-width: 50px; /* Ensure minimum width for the badge */
      text-align: center;
    }
  
    .event-sentiment {
      display: inline-flex;
      align-items: center;
      font-size: 14px;
      padding: 4px 0;
      font-weight: 500;
      margin-left: 6px; /* Add explicit left margin */
    }
  
    .sentiment-icon {
      margin-right: 6px;
      font-weight: bold;
    }
  
    .event-dates {
      margin: 15px 0;
      line-height: 1.5;
    }
  
    .description-title {
      margin: 18px 0 10px 0;
      font-size: 16px;
      font-weight: 600;
    }
  
    .description-content {
      line-height: 1.5;
    }
  
    @media (max-width: 768px) {
      .event-modal-content {
        width: 95%;
        padding: 15px;
      }
    }
  `]
})
export class EventModalComponent {
  @Input() isVisible = false;
  @Input() title = '';
  @Input() eventType = '';
  @Input() typeColor = '';
  @Input() sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  @Input() sentimentColor = '';
  @Input() sentimentIcon = '';
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() description = '';
  
  @Output() closeModal = new EventEmitter<void>();

  get sentimentText(): string {
    return this.sentiment.charAt(0).toUpperCase() + this.sentiment.slice(1) + ' sentiment';
  }

  close(): void {
    this.closeModal.emit();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('event-modal')) {
      this.close();
    }
  }
}