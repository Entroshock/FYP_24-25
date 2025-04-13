// Enhanced event-modal.component.ts with improved image handling
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="event-modal" [class.active]="isVisible" (click)="closeOnBackdrop($event)">
    <div class="event-modal-content">
      <span class="close-modal" (click)="close()">&times;</span>
      
      <!-- Event Image (if available) - with error handling -->
      <div class="event-image-container" *ngIf="imageUrl">
        <img [src]="imageUrl" 
             alt="{{ title }} image" 
             class="event-image"
             (error)="handleImageError($event)">
      </div>
      
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
  // Updated styles for event-modal.component.ts
styles: [`
  .event-modal {
    display: none;
    position: fixed;
    z-index: 1001;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
  }

  .event-modal.active {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .event-modal-content {
    background-color: rgba(15, 15, 20, 0.95);
    margin: auto;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    max-height: 85vh;
    overflow-y: auto;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .close-modal {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    font-weight: normal;
    cursor: pointer;
    color: #cccccc;
    z-index: 10;
  }

  .close-modal:hover {
    color: #ffffff;
  }

  .event-title {
    margin: 0 0 15px 0;
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
  }

  .event-image-container {
    margin-bottom: 20px;
    text-align: center;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    background-color: rgba(25, 25, 30, 0.5);
    position: relative;
  }

  .event-image {
    width: 100%;
    max-height: 250px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
  }

  .event-meta {
    margin-bottom: 15px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 25px;
  }

  .event-type-badge {
    display: inline-block;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
    min-width: 50px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .event-sentiment {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    padding: 4px 0;
    font-weight: 500;
    margin-left: 6px;
  }

  .sentiment-icon {
    margin-right: 6px;
    font-weight: bold;
  }

  .event-dates {
    margin: 15px 0;
    line-height: 1.5;
    background-color: rgba(255, 255, 255, 0.05);
    padding: 10px;
    border-radius: 6px;
  }

  .description-title {
    margin: 18px 0 10px 0;
    font-size: 16px;
    font-weight: 600;
    color: #e6e6e6;
  }

  .description-content {
    line-height: 1.5;
    color: #cccccc;
    background-color: rgba(255, 255, 255, 0.05);
    padding: 10px;
    border-radius: 6px;
  }

  @media (max-width: 768px) {
    .event-modal-content {
      width: 95%;
      padding: 15px;
    }
    
    .event-image {
      max-height: 200px;
    }
  }
`]
})
export class EventModalComponent implements OnChanges {
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
  @Input() imageUrl = ''; // Input for image URL
  
  @Output() closeModal = new EventEmitter<void>();

  // Log inputs when they change
  ngOnChanges(changes: SimpleChanges): void {
    // Log changes as before
    if (changes['imageUrl']) {
      console.log('Modal imageUrl changed:', this.imageUrl);
    }
    
    // Reset scroll position when modal becomes visible
    if (changes['isVisible'] && this.isVisible) {
      console.log('Modal opened with imageUrl:', this.imageUrl);
      
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        // Find the modal content element and reset its scroll position
        const modalContent = document.querySelector('.event-modal-content');
        if (modalContent) {
          modalContent.scrollTop = 0;
        }
      }, 0);
    }
  }

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
  
  // Handle image loading errors
  handleImageError(event: any): void {
    console.error('Image failed to load:', this.imageUrl);
    // Could set a fallback image here
    event.target.src = '/assets/images/placeholder.png'; 
    
    // Or just hide the image container
    // const container = event.target.parentElement;
    // if (container) {
    //   container.style.display = 'none';
    // }
  }
}