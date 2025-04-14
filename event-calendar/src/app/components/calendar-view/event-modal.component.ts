import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
      
      <!-- Use the formatted HTML description -->
      <h3 class="description-title">Description</h3>
      <div class="description-content" [innerHTML]="formattedDescription"></div>
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
    color: #cccccc;
    line-height: 1.6;
    background-color: rgba(20, 20, 25, 0.3);
    padding: 10px !important;
    border-radius: 6px;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }

  /* Common elements styling */
  :host ::ng-deep .event-header {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    margin: 10px 0 !important;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8) !important;
    padding: 10px 0 !important;
    display: block !important;
  }

  :host ::ng-deep .event-subheader {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #e0e0e0 !important;
    margin: 15px 0 8px 0 !important;
    padding-bottom: 8px !important;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8) !important;
    display: block !important;
  }

  :host ::ng-deep .bullet-point {
    display: block !important;
    margin: 8px 0 !important;
    padding-left: 18px !important;
    position: relative !important;
    color: #b0b0b0 !important;
    font-weight: normal !important;
  }

  :host ::ng-deep .bullet-point::before {
    content: "•" !important;
    position: absolute !important;
    left: 6px !important;
    color: #9e9e9e !important;
  }

  :host ::ng-deep p {
    margin: 8px 0 !important;
    color: #b0b0b0 !important;
    font-weight: normal !important;
    display: block !important;
  }

  /* VERSION UPDATE STYLING */
  /* ONLY Numbered section headers (1. New Story, etc.) */
  :host ::ng-deep .update-section-header {
    font-size: 16px !important;
    font-weight: 700 !important; /* Bold text ONLY for main section headers */
    color: #ffffff !important; /* White text ONLY for headers */
    margin: 16px 0 8px 0 !important;
    padding: 6px 0 !important;
    display: block !important;
    border-bottom: 1px solid rgba(80, 80, 80, 0.5) !important;
  }

  /* ALL regular content (character descriptions, body text, etc.) */
  :host ::ng-deep .update-content {
    color: #b0b0b0 !important; /* Lighter gray for content */
    margin: 6px 0 !important;
    padding: 2px 0 !important;
    line-height: 1.4 !important;
    display: block !important;
    font-weight: normal !important; /* CRITICAL: Ensure content is not bold */
  }

  /* Special requirement sections (Event Period, etc.) */
  :host ::ng-deep .update-requirement {
    color: #cccccc !important;
    background-color: rgba(30, 30, 35, 0.5) !important;
    padding: 6px 8px !important;
    margin: 8px 0 !important;
    border-radius: 4px !important;
    font-style: italic !important;
    display: block !important;
    font-weight: normal !important; /* Ensure requirements are not bold */
  }

  /* Notes with ※ symbols */
  :host ::ng-deep .update-note {
    padding: 6px 10px !important;
    margin: 8px 0 !important;
    color: #aaaaaa !important;
    font-style: italic !important;
    background-color: rgba(40, 40, 40, 0.4) !important;
    border-radius: 4px !important;
    border-left: 3px solid rgba(180, 180, 180, 0.3) !important;
    display: block !important;
    font-weight: normal !important; /* Ensure notes are not bold */
  }

  /* CONTRACT SHOP STYLING */
  :host ::ng-deep .release-time {
    color: #ffffff !important;
    padding: 6px 8px !important;
    margin: 8px 0 !important;
    display: block !important;
    font-weight: 500 !important;
    background-color: rgba(30, 30, 35, 0.5) !important;
    border-radius: 4px !important;
  }

  /* Completely redone contract styling for consistency */
  :host ::ng-deep .contract-item {
    margin: 10px 0 !important;
    padding: 8px !important;
    background-color: rgba(30, 30, 35, 0.5) !important;
    border-radius: 4px !important;
    border-left: 2px solid rgba(150, 150, 150, 0.5) !important;
    display: block !important;
  }

  :host ::ng-deep .contract-header {
    font-weight: 600 !important;
    color: #e0e0e0 !important;
    margin-bottom: 6px !important;
    display: block !important;
    font-size: 15px !important;
  }

  :host ::ng-deep .contract-content {
    padding: 4px 0 !important;
    color: #cccccc !important;
    display: block !important;
    font-weight: normal !important; /* CRITICAL: Ensure contract content is not bold */
    margin: 8px 0 !important;
    line-height: 1.4 !important;
  }

  :host ::ng-deep .price-info {
    margin-top: 6px !important;
    padding: 6px 8px !important;
    background-color: rgba(40, 40, 40, 0.5) !important;
    border-radius: 4px !important;
    font-style: italic !important;
    color: #aaaaaa !important;
    display: block !important;
    font-weight: normal !important; /* Ensure price info is not bold */
  }

  /* Ensure no content leaks into other sections */
  :host ::ng-deep .update-content, 
  :host ::ng-deep .update-requirement,
  :host ::ng-deep .update-note,
  :host ::ng-deep .bullet-point,
  :host ::ng-deep .contract-content,
  :host ::ng-deep .price-info {
    white-space: normal !important; /* Allow text to wrap normally */
    word-break: break-word !important; /* Break words if needed */
  }

  /* Remove any legacy styles */
  :host ::ng-deep .contract-block,
  :host ::ng-deep .price-block,
  :host ::ng-deep .regular-contract,
  :host ::ng-deep .shop-header,
  :host ::ng-deep .shop-section,
  :host ::ng-deep .intro-text {
    background-color: rgba(30, 30, 35, 0.5) !important;
    padding: 8px !important;
    margin: 8px 0 !important;
    border-radius: 4px !important;
    border-left: 2px solid rgba(150, 150, 150, 0.5) !important;
    display: block !important;
    font-weight: normal !important;
  }

  /* Media query for mobile adjustments */
  @media (max-width: 768px) {
    .event-modal-content {
      width: 95%;
      padding: 15px;
    }
    
    .event-image {
      max-height: 200px;
    }
    
    /* Mobile-specific styling adjustments */
    :host ::ng-deep .update-section-header {
      margin: 14px 0 6px 0 !important;
      padding: 5px 0 !important;
    }
    
    :host ::ng-deep .event-header {
      margin: 10px 0 6px 0;
      padding: 6px 0;
    }
    
    :host ::ng-deep .event-subheader {
      margin: 8px 0 4px 0;
      padding-bottom: 3px;
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

  // HTML formatted description
  formattedDescription: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  // Format the description when inputs change
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['description']) {
      this.formattedDescription = this.formatDescription(this.description);
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
    event.target.src = '/assets/images/placeholder.png'; 
  }

  // Final formatter with comprehensive pattern matching and consistent styling
  private formatDescription(text: string): SafeHtml {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');

    console.log('Raw description length:', text.length);
    
    // Improved content type detection
    const isVersionUpdate = text.includes('Version Update Details') || 
                           text.includes('New Story') ||
                           /\d+\.\s+New\s+/.test(text) ||
                           (text.includes('New Characters') && text.includes('5-Star')) ||
                           (text.includes('Update Time') && text.includes('Requirement:'));
                              
    const isContractShop = text.includes('Contract Shop Update') || 
                           text.includes('Herta Contract:');
    
    // Debug logging to help diagnose content type detection
    console.log('Content type detection:', { 
      isVersionUpdate, 
      isContractShop,
      hasNewStory: text.includes('New Story'),
      hasNumberedPattern: /\d+\.\s+New\s+/.test(text)
    });
    
    // Prepare the full text before processing
    let processedText = text;
    
    // Fix special character issues and ensure newlines for parsing
    processedText = processedText
      // Add line breaks before section markers (▌)
      .replace(/([^\n])▌/g, '$1\n\n▌')
      // Add line breaks before subsection markers (■)
      .replace(/([^\n])■/g, '$1\n\n■')
      // Add line breaks before bullet points (●)
      .replace(/([^\n])●/g, '$1\n\n●')
      // Add line breaks before notes (※)
      .replace(/([^\n])※/g, '$1\n※')
      // Add line breaks before numbered sections (1., 2., etc.)
      .replace(/([^\n])(\d+\.\s+[A-Z])/g, '$1\n\n$2')
      // Fix for "The Herta Contract:" being split
      .replace(/\n\s*The\s*\n\s*Herta Contract:/g, '\nThe Herta Contract:')
      // Make sure contract headers are together with content
      .replace(/([^\n])(The Herta Contract:|Herta Contract:)/g, '$1\n\n$2');
    
    // FIX FOR PRICES WITH COMMAS
    const multiplierCommaMatch = processedText.match(/×(\d+),/g);
    if (multiplierCommaMatch) {
      for (const match of multiplierCommaMatch) {
        const numBeforeComma = match.replace('×', '').replace(',', '');
        const afterMatchPos = processedText.indexOf(match) + match.length;
        const afterText = processedText.substring(afterMatchPos, afterMatchPos + 10);
        
        const digitMatch = afterText.match(/^\s*(\d+)/);
        if (digitMatch) {
          const fullNumber = `×${numBeforeComma},${digitMatch[1]}`;
          const searchPattern = new RegExp(`${match.replace(/[×,]/g, '\\$&')}\\s*${digitMatch[1]}`);
          processedText = processedText.replace(searchPattern, fullNumber);
        }
      }
    }
    
    // Split into lines for processing
    const lines = processedText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Process lines into HTML
    let htmlOutput = '';
    
    // Process based on content type
    if (isVersionUpdate) {
      // For version update details
      let currentSection = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Major headers (Version Update Details, etc.)
        if (line.includes('Version Update Details') || line.includes('Update Details')) {
          htmlOutput += `<div class="event-header">${line}</div>`;
          continue;
        }
        
        // MAIN SECTION HEADERS: ONLY exact pattern for numbered sections (1. New Story)
        // VERY strictly match ONLY the numbered headers like "1. New Story"
        if (/^\d+\.\s+New\s+[A-Z][a-z]+$/.test(line) || 
            /^\d+\.\s+New\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line) ||
            /^\d+\.\s+New\s+[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line)) {
          htmlOutput += `<div class="update-section-header">${line}</div>`;
          currentSection = line;
          continue;
        }
        
        // EXPANDED: Any other content starting with category names should be normal content
        // Fixes for issues in Images 2-3 where "Missions", "System", "Audio" sections are bold
        if (/^(Missions|System|Audio|Gameplay|Events|Combat|Adjustments|Optimizations)\s/.test(line)) {
          // These should be normal content, not headers
          htmlOutput += `<div class="update-content">${line}</div>`;
          continue;
        }
        
        // Character sections ("5-Star character Name") - regular content, not headers
        if ((line.startsWith('5-Star') || line.startsWith('4-Star')) || 
            line.startsWith('■ 5-Star') || line.startsWith('■ 4-Star')) {
          // Remove any bullet symbols but keep as regular content
          const cleanLine = line.replace(/^[■●]\s*/, '').trim();
          htmlOutput += `<div class="update-content">${cleanLine}</div>`;
          continue;
        }
        
        // Section headers with ■ symbols (not for character descriptions)
        if ((line.startsWith('■') || line.includes('■')) && 
            !line.includes('Star') && !line.includes('character')) {
          const cleanLine = line.replace('■', '').trim();
          htmlOutput += `<div class="event-subheader">${cleanLine}</div>`;
          continue;
        }
        
        // Major section headers (▌ symbols), excluding character descriptions
        if ((line.startsWith('▌') || line.includes('▌')) && 
            !line.includes('Star') && !line.includes('character')) {
          const cleanLine = line.replace('▌', '').trim();
          htmlOutput += `<div class="event-header">${cleanLine}</div>`;
          continue;
        }
        
        // Event Period/Requirements - special styling
        if (line.includes('Event Period:') || line.includes('Event Period') || 
            line.startsWith('Requirement:') || line.includes('Requirement:')) {
          htmlOutput += `<div class="update-requirement">${line}</div>`;
          continue;
        }
        
        // Other time/date references
        if (line.includes('Update Time') || line.includes('Update Time:')) {
          htmlOutput += `<div class="update-requirement">${line}</div>`;
          continue;
        }
        
        // Notes with ※ symbols
        if (line.startsWith('※') || line.includes('※')) {
          htmlOutput += `<div class="update-note">${line}</div>`;
          continue;
        }
        
        // Bullet points
        if (line.startsWith('●') || line.includes('●') || line.startsWith('.')) {
          const cleanLine = line.replace(/^[●.]\s*/, '').trim();
          htmlOutput += `<div class="bullet-point">${cleanLine}</div>`;
          continue;
        }
        
        // Default content for version update - use update-content class for consistent styling
        htmlOutput += `<div class="update-content">${line}</div>`;
      }
    } 
    else if (isContractShop) {
      // For contract shop updates - completely reworked approach for consistent formatting
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Shop/section header (title with Version update)
        if (line.includes('Version') && (line.includes('Contract Shop Update') || line.includes('Shop Update'))) {
          htmlOutput += `<div class="event-header">${line}</div>`;
          continue;
        }
        
        // Time/period header
        if (line.includes('Release Time') || line.includes('After the Version') || line.includes('Event Period')) {
          htmlOutput += `<div class="release-time">${line}</div>`;
          continue;
        }
        
        // Section headers (■ symbols)
        if (line.startsWith('■') || line.includes('■')) {
          const cleanLine = line.replace('■', '').trim();
          htmlOutput += `<div class="event-subheader">${cleanLine}</div>`;
          continue;
        }
        
        // Major section headers (▌ symbols)
        if (line.startsWith('▌') || line.includes('▌')) {
          const cleanLine = line.replace('▌', '').trim();
          htmlOutput += `<div class="event-header">${cleanLine}</div>`;
          continue;
        }
        
        // Bullet points
        if (line.startsWith('●') || line.includes('●')) {
          const cleanLine = line.replace('●', '').trim();
          htmlOutput += `<div class="bullet-point">${cleanLine}</div>`;
          continue;
        }
        
        // NEW APPROACH FOR CONTRACT ITEMS: Process entire contract as a single block
        if (line.includes('Herta Contract:')) {
          const contractBlock = this.processContractBlock(lines, i);
          htmlOutput += contractBlock.html;
          i = contractBlock.endIndex; // Skip to the end of this contract block
          continue;
        }
        
        // Default case - regular content
        htmlOutput += `<p>${line}</p>`;
      }
    }
    else {
      // Default generic processing for other event types
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Section headers (■ symbols)
        if (line.startsWith('■') || line.includes('■')) {
          const cleanLine = line.replace('■', '').trim();
          htmlOutput += `<div class="event-subheader">${cleanLine}</div>`;
          continue;
        }
        
        // Major section headers (▌ symbols)
        if (line.startsWith('▌') || line.includes('▌')) {
          const cleanLine = line.replace('▌', '').trim();
          htmlOutput += `<div class="event-header">${cleanLine}</div>`;
          continue;
        }
        
        // Bullet points
        if (line.startsWith('●') || line.includes('●')) {
          const cleanLine = line.replace('●', '').trim();
          htmlOutput += `<div class="bullet-point">${cleanLine}</div>`;
          continue;
        }
        
        // Default case - regular content
        htmlOutput += `<p>${line}</p>`;
      }
    }
    
    // Add a wrapper for consistent styling
    htmlOutput = `<div class="formatted-content">${htmlOutput}</div>`;
    
    // Ensure we don't break content across "×" multipliers (fixing the Fuel × 10 issue)
    htmlOutput = htmlOutput.replace(/([×]\s*)(<\/div>)(<div[^>]*>)(\d+)/g, '$1$4$2');
    
    // Return sanitized HTML
    return this.sanitizer.bypassSecurityTrustHtml(htmlOutput);
  }

  // Helper method to process a complete contract block
  private processContractBlock(lines: string[], startIndex: number): { html: string, endIndex: number } {
    let htmlOutput = '';
    let currentIndex = startIndex;
    const contractLine = lines[startIndex];
    
    // Ensure consistent contract naming (always include "The")
    let contractHeader = contractLine;
    if (!contractLine.startsWith('The ') && contractLine.includes('Herta Contract:')) {
      contractHeader = 'The ' + contractLine;
    }
    
    // Start contract container
    htmlOutput += `<div class="contract-item">`;
    
    // Add contract header
    htmlOutput += `<div class="contract-header">${contractHeader}</div>`;
    
    // Collect all content from this contract until the next contract or major section
    let contractContentLines = [];
    let priceInfo = null;
    let maxPurchases = null;
    let currentLine;
    
    // Move to next line
    currentIndex++;
    
    // Process until we hit another contract, section header, or end of lines
    while (currentIndex < lines.length && 
           !lines[currentIndex].includes('Herta Contract:') && 
           !lines[currentIndex].includes('■') && 
           !lines[currentIndex].includes('▌')) {
      
      currentLine = lines[currentIndex];
      
      // Check for price info
      if (currentLine.includes('Price:')) {
        priceInfo = currentLine;
      }
      // Check for maximum purchase info
      else if (currentLine.includes('maximum') || 
               (currentLine.startsWith('A maximum') || currentLine.startsWith('. A maximum'))) {
        maxPurchases = currentLine;
      }
      // Otherwise collect as regular content
      else if (currentLine.trim() !== '') {
        contractContentLines.push(currentLine);
      }
      
      currentIndex++;
    }
    
    // Add contract content as one block
    if (contractContentLines.length > 0) {
      htmlOutput += `<div class="contract-content">${contractContentLines.join(' ')}</div>`;
    }
    
    // Add price info
    if (priceInfo) {
      htmlOutput += `<div class="price-info">${priceInfo}</div>`;
    }
    
    // Add maximum purchases info
    if (maxPurchases) {
      htmlOutput += `<div class="price-info">${maxPurchases}</div>`;
    }
    
    // Close the contract block
    htmlOutput += `</div>`;
    
    // Return the HTML and the new index position
    return {
      html: htmlOutput,
      endIndex: currentIndex - 1 // Return to the last processed line
    };
  }
}