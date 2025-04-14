// Enhanced event-modal.component.ts with styling to match the target format
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
    padding: 0;
    border-radius: 6px;
  }

  /* Deep styling for formatted content elements */
  :host ::ng-deep .shop-header {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    padding: 15px 0;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8);
  }

  :host ::ng-deep .shop-section {
    display: block;
    padding: 15px 0;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8);
  }

  :host ::ng-deep .release-time {
    color: #ffffff;
    padding: 10px 0;
    margin: 0;
    display: block;
  }

  :host ::ng-deep .contract-block {
    background-color: rgba(40, 65, 100, 0.4);
    padding: 15px;
    margin: 0 0 2px 0;
    display: block;
    border-left: 3px solid rgba(76, 175, 255, 0.5);
  }

  :host ::ng-deep .price-block {
    background-color: rgba(40, 40, 40, 0.5);
    padding: 12px 15px;
    margin: 0 0 10px 0;
    display: block;
    font-style: italic;
    color: #aaaaaa;
  }

  :host ::ng-deep .regular-contract {
    padding: 15px 0;
    margin: 0;
    display: block;
  }

  :host ::ng-deep .event-header {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 10px 0;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8);
    padding: 10px 0;
  }

  :host ::ng-deep .event-subheader {
    font-size: 16px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 15px 0 8px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8);
  }

  :host ::ng-deep .intro-text {
    border-left: 3px solid rgba(76, 175, 80, 0.6);
    padding: 10px 15px;
    margin: 10px 0;
    background-color: rgba(40, 40, 40, 0.3);
    border-radius: 0 4px 4px 0;
  }

  :host ::ng-deep .bullet-point {
    display: block;
    margin: 8px 0;
    padding-left: 18px;
    position: relative;
  }

  :host ::ng-deep .bullet-point::before {
    content: "•";
    position: absolute;
    left: 6px;
    color: #9e9e9e;
  }

  :host ::ng-deep p {
    margin: 8px 0;
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

  // Format the description to HTML with proper styling
  private formatDescription(text: string): SafeHtml {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');

    console.log('Raw description length:', text.length);
    
    // Detect content types
    const isContractShop = text.toLowerCase().includes('contract shop') || 
                          text.includes('The Herta Contract:');
                          
    const isVersionUpdate = text.toLowerCase().includes('version update') ||
                          text.includes('Update and Compensation Details');
    
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
      // Add line breaks before contract headers
      .replace(/([^\n])(The Herta Contract:)/g, '$1\n\n$2')
      // Add line breaks after "Price:" if needed
      .replace(/(Price:.*?)(×\d+)([^\n])/g, '$1$2\n$3');
    
    // FIX FOR PRICES WITH COMMAS
    // First find all instances of "×" followed by digits then a comma
    const multiplierCommaMatch = processedText.match(/×(\d+),/g);
    if (multiplierCommaMatch) {
      for (const match of multiplierCommaMatch) {
        // Replace any number after the match that might be the continuation
        const numBeforeComma = match.replace('×', '').replace(',', '');
        const afterMatchPos = processedText.indexOf(match) + match.length;
        const afterText = processedText.substring(afterMatchPos, afterMatchPos + 10);
        
        // If the next segment has digits
        const digitMatch = afterText.match(/^\s*(\d+)/);
        if (digitMatch) {
          // Join the parts back - replace both with the combined number
          const fullNumber = `×${numBeforeComma},${digitMatch[1]}`;
          // Create a pattern to find this specific instance and any following digits
          const searchPattern = new RegExp(`${match.replace(/[×,]/g, '\\$&')}\\s*${digitMatch[1]}`);
          processedText = processedText.replace(searchPattern, fullNumber);
        }
      }
    }
    
    // Split into lines for processing
    const lines = processedText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Process lines into HTML based on content type
    let htmlOutput = '';
    
    // For shop content - use specific formatting to match the target
    if (isContractShop) {
      let inContractBlock = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
        
        // Shop header
        if (line.includes('Contract Shop Update')) {
          htmlOutput += `<div class="shop-header">${line}</div>`;
          continue;
        }
        
        // Release Time
        if (line.includes('Release Time') || line.includes('After the Version')) {
          htmlOutput += `<div class="shop-section"><div class="release-time">${line}</div></div>`;
          continue;
        }
        
        // Herta Contract block
        if (line.includes('The Herta Contract:')) {
          // If already in a contract block, close it
          if (inContractBlock) {
            htmlOutput += `</div>`;
          }
          
          htmlOutput += `<div class="contract-block">${line}`;
          inContractBlock = true;
          
          // Look ahead for price/availability
          let j = i + 1;
          let contractContent = '';
          let foundPrice = false;
          
          while (j < lines.length && !lines[j].includes('The Herta Contract:') && !lines[j].includes('Contract Shop Update')) {
            // If this is a price line or a number (like 720) 
            if (lines[j].includes('Price:') || /^\d+$/.test(lines[j].trim()) || 
                lines[j].includes('Oneiric Shards')) {
              // If we're still building the contract, close it
              if (inContractBlock) {
                htmlOutput += `${contractContent}</div>`;
                contractContent = '';
                inContractBlock = false;
              }
              
              // Add this as a price block
              htmlOutput += `<div class="price-block">${lines[j]}`;
              foundPrice = true;
              
              // Look for maximum line
              if (j + 1 < lines.length && lines[j+1].includes('maximum')) {
                htmlOutput += `<br>${lines[j+1]}`;
                j++; // Skip the next line since we used it
              }
              
              htmlOutput += `</div>`;
            } 
            else if (foundPrice && (lines[j].includes('Herta Contract:') || j === lines.length - 1)) {
              // New contract found after price, break
              break;
            }
            else {
              // Regular content stays in the contract
              contractContent += (contractContent ? ' ' : '') + lines[j];
            }
            j++;
          }
          
          // If we haven't closed the contract block, do it now
          if (inContractBlock) {
            htmlOutput += `${contractContent}</div>`;
            inContractBlock = false;
          }
          
          // Skip ahead since we've processed these lines
          i = j - 1;
          continue;
        }
        
        // Regular contract line (no The Herta Contract: prefix)
        if (line.includes('Herta Contract:') && !line.includes('The Herta Contract:')) {
          htmlOutput += `<div class="regular-contract">${line}`;
          
          // Look ahead for price/availability
          let j = i + 1;
          let contractContent = '';
          let foundPrice = false;
          
          while (j < lines.length && !lines[j].includes('Herta Contract:') && !lines[j].includes('Contract Shop Update')) {
            // If this is a price line or a number (like 330) 
            if (lines[j].includes('Price:') || /^\d+$/.test(lines[j].trim()) || 
                lines[j].includes('Oneiric Shards')) {
              // Close the regular contract
              htmlOutput += `${contractContent}</div>`;
              contractContent = '';
              
              // Add this as a price block
              htmlOutput += `<div class="price-block">${lines[j]}`;
              foundPrice = true;
              
              // Look for maximum line
              if (j + 1 < lines.length && lines[j+1].includes('maximum')) {
                htmlOutput += `<br>${lines[j+1]}`;
                j++; // Skip the next line since we used it
              }
              
              htmlOutput += `</div>`;
            } 
            else if (foundPrice && (lines[j].includes('Herta Contract:') || j === lines.length - 1)) {
              // New contract found after price, break
              break;
            }
            else {
              // Regular content
              contractContent += (contractContent ? ' ' : '') + lines[j];
            }
            j++;
          }
          
          // If we still have content, add it
          if (contractContent) {
            htmlOutput += `${contractContent}</div>`;
          }
          
          // Skip ahead since we've processed these lines
          i = j - 1;
          continue;
        }
        
        // Price numbers on their own
        if (/^\d+$/.test(line.trim()) && isContractShop) {
          // Standalone price
          htmlOutput += `<div class="price-block">${line}`;
          
          // Look for maximum line
          if (i + 1 < lines.length && lines[i+1].includes('maximum')) {
            htmlOutput += `<br>${lines[i+1]}`;
            i++; // Skip the next line since we used it
          }
          
          htmlOutput += `</div>`;
          continue;
        }
        
        // Default case - regular content
        htmlOutput += `<p>${line}</p>`;
      }
    }
    // For version updates and other content
    else {
      let foundFirstSection = false;
      let introLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for major headers
        if (line.includes('▌') || line.match(/^Version \d+\.\d+ .* Update Details$/)) {
          if (introLines.length > 0 && !foundFirstSection) {
            // If we collected intro lines, add them first
            htmlOutput += `<div class="intro-text">${introLines.join(' ')}</div>`;
            introLines = [];
          }
          
          htmlOutput += `<div class="event-header">${line.replace('▌', '')}</div>`;
          foundFirstSection = true;
        } 
        else if (line.toLowerCase().includes('update and compensation details')) {
          if (introLines.length > 0 && !foundFirstSection) {
            // If we collected intro lines, add them first
            htmlOutput += `<div class="intro-text">${introLines.join(' ')}</div>`;
            introLines = [];
          }
          
          htmlOutput += `<div class="event-header">${line}</div>`;
          foundFirstSection = true;
        }
        else if (line.includes('■') || 
                (foundFirstSection && line.match(/^(Update Time|Compensation Details|How to Update|Reset Time|Reset Details)/i))) {
          htmlOutput += `<div class="event-subheader">${line.replace('■', '')}</div>`;
        }
        else if (line.includes('●')) {
          htmlOutput += `<div class="bullet-point">${line.replace('●', '')}</div>`;
        }
        else if (!foundFirstSection) {
          // Collect intro lines
          introLines.push(line);
        }
        else {
          // Regular paragraphs
          htmlOutput += `<p>${line}</p>`;
        }
      }
      
      // If we have intro lines left, add them
      if (introLines.length > 0) {
        htmlOutput = `<div class="intro-text">${introLines.join(' ')}</div>` + htmlOutput;
      }
    }
    
    // Add a wrapper for consistent styling
    htmlOutput = `<div class="formatted-content">${htmlOutput}</div>`;
    
    // Return sanitized HTML
    return this.sanitizer.bypassSecurityTrustHtml(htmlOutput);
  }
}