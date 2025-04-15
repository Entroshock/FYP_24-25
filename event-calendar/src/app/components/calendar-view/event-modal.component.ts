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
    box-sizing: border-box;
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

  /* Improved description content styles */
  .description-content {
    color: #cccccc;
    line-height: 1.6;
    background-color: rgba(20, 20, 25, 0.3);
    padding: 10px !important;
    border-radius: 6px;
    font-size: 14px !important;
    line-height: 1.5 !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    hyphens: none !important;
    white-space: pre-wrap !important;
    max-width: 100% !important;
    font-family: 'Arial', sans-serif !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  /* Section image styles */
  .section-image-container {
    margin: 10px 0 20px 0;
    text-align: center;
    border-radius: 6px;
    overflow: hidden;
    background-color: rgba(25, 25, 30, 0.5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    position: relative;
    max-width: 100%;
  }

  .section-image {
    max-width: 100%;
    max-height: 250px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    padding: 10px 0;
  }

  /* Add a subtle animation when images appear */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .section-image-container {
    animation: fadeIn 0.3s ease-out;
  }

  /* Helper class for text containers */
  .text-wrapper {
    display: inline-block;
    width: 100%;
    overflow-wrap: break-word;
    word-break: normal;
    white-space: pre-wrap;
  }

  /* Common elements styling with improved text wrapping */
  :host ::ng-deep .event-header {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    margin: 10px 0 !important;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8) !important;
    padding: 10px 0 !important;
    display: block !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  :host ::ng-deep .event-subheader {
    font-size: 16px !important;
    font-weight: 400 !important; /* Normal font weight (not bold) */
    color: #e0e0e0 !important;
    margin: 15px 0 8px 0 !important;
    padding-bottom: 8px !important;
    border-bottom: 1px solid rgba(50, 50, 50, 0.8) !important;
    display: block !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  :host ::ng-deep .bullet-point {
    display: block !important;
    margin: 8px 0 !important;
    padding-left: 18px !important;
    position: relative !important;
    color: #b0b0b0 !important;
    font-weight: normal !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  /* ALL regular content (character descriptions, body text, etc.) */
  :host ::ng-deep .update-content {
    color: #b0b0b0 !important; /* Lighter gray for content */
    margin: 6px 0 !important;
    padding: 2px 0 !important;
    line-height: 1.4 !important;
    display: block !important;
    font-weight: normal !important; /* CRITICAL: Ensure content is not bold */
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  /* Completely redone contract styling for consistency */
  :host ::ng-deep .contract-item {
    margin: 10px 0 !important;
    padding: 8px !important;
    background-color: rgba(30, 30, 35, 0.5) !important;
    border-radius: 4px !important;
    border-left: 2px solid rgba(150, 150, 150, 0.5) !important;
    display: block !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  :host ::ng-deep .contract-header {
    font-weight: 600 !important;
    color: #e0e0e0 !important;
    margin-bottom: 6px !important;
    display: block !important;
    font-size: 15px !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  :host ::ng-deep .contract-content {
    padding: 4px 0 !important;
    color: #cccccc !important;
    display: block !important;
    font-weight: normal !important; /* CRITICAL: Ensure contract content is not bold */
    margin: 8px 0 !important;
    line-height: 1.4 !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
  }

  /* Fix for ensuring all text elements have consistent wrapping */
  :host ::ng-deep .description-content *,
  :host ::ng-deep .event-modal-content * {
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
    word-break: normal !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    hyphens: none !important;
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
  @Input() imageUrl = '';
  @Input() sectionImages: {[key: string]: string} = {}; // New input for section images
  
  @Output() closeModal = new EventEmitter<void>();

  // HTML formatted description
  formattedDescription: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  // Format the description when inputs change
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['description'] || changes['sectionImages']) {
      this.formattedDescription = this.formatDescription(this.description);
    }
    
    // Reset scroll position when modal becomes visible
    if (changes['isVisible'] && this.isVisible) {
      console.log('Modal opened with imageUrl:', this.imageUrl);
      console.log('Section images available:', Object.keys(this.sectionImages));
      
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

// Updated preprocessText method with better handling of text breaks
/**
 * Enhanced preprocessText function to fix all word wrapping issues
 * This handles date/time formats, trailing characters, and special terms
 */
private preprocessText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // ===== FIX DATE AND TIME FORMATS =====
  
  // Fix ISO dates with times (main issue from screenshots)
  processedText = processedText.replace(
    /(\d{4}\/\d{2}\/\d{2})\s+(\d{2}):\s*(\d{2}):\s*(\d{2})/g, 
    '$1 <span style="white-space:nowrap">$2:$3:$4</span>'
  );
  
  // Fix date ranges with em-dashes or hyphens
  processedText = processedText.replace(
    /(<span[^>]*>\d{2}:\d{2}:\d{2}<\/span>)\s*[–\-]\s*(\d{4}\/\d{2}\/\d{2})/g,
    '$1 – <span style="white-space:nowrap">$2'
  );
  
  // Fix "server time" and "UTC+8" parentheses staying with the time
  processedText = processedText.replace(
    /(<\/span>)\s*\((server time|UTC\+8)\)/g,
    '$1 <span style="white-space:nowrap">($2)</span>'
  );
  
  // Fix period after version updates
  processedText = processedText.replace(
    /(After\s+Version\s+\d+\.\d+\s+[Uu]pdate)/g,
    '<span style="white-space:nowrap">$1</span>'
  );
  
  // ===== FIX EVENT TITLES AND DESCRIPTIONS =====
  
  // Fix trailing 's' characters after event names
  processedText = processedText.replace(
    /(Shadow|Fiction|Chaos|Locust|Rule|Othershor):\s+([^\n]+)\n\s*([se])/g,
    '$1: $2'
  );
  
  // Fix "Apocalyptic Shadow" not wrapping properly
  processedText = processedText.replace(
    /(•|●)\s*(Apocalyptic Shadow:|Pure Fiction:|Memory of Chaos:)/g,
    '$1 <span style="white-space:nowrap">$2</span>'
  );
  
  // ===== FIX SPECIAL TERMS =====
  
  // Fix "Compensation" breaking
  processedText = processedText.replace(
    /([Ss]erver\s+)?[Mm]aintenance\s+[Cc]ompensation/g, 
    '<span style="white-space:nowrap">$&</span>'
  );
  
  processedText = processedText.replace(
    /[Bb]ug\s+[Cc]ompensation/g, 
    '<span style="white-space:nowrap">$&</span>'
  );
  
  // Fix "Eligible Recipients" breaking
  processedText = processedText.replace(
    /Eligible\s+Recipients/g, 
    '<span style="white-space:nowrap">Eligible Recipients</span>'
  );
  
  // Fix quantities with × symbol
  processedText = processedText.replace(
    /(×|x)\s*(\d+)/g, 
    '<span style="white-space:nowrap">$1$2</span>'
  );
  
  // ===== STANDARD FORMATTING FIXES =====
  
  // Standardize bullet points (change ● to •)
  processedText = processedText.replace(/●/g, '•');
  
  // Carefully ensure section markers are properly spaced
  processedText = processedText.replace(/▌([A-Za-z])/g, '▌ $1');
  
  // Carefully ensure bullet points are properly spaced
  processedText = processedText.replace(/•([A-Za-z])/g, '• $1');
  
  // Fix broken "Skill Lv. +" lines where numbers might appear at start of next line
  processedText = processedText.replace(/Skill Lv\. \+\s*\n\s*(\d+)/g, 'Skill Lv. +$1');
  
  // Make sure Event Details section is properly formatted
  if (processedText.includes('▌ Event Details') || processedText.includes('▌Event Details')) {
    // Add newlines around Event Details section if not already present
    processedText = processedText.replace(/([^\n])▌\s*Event Details/g, '$1\n\n▌ Event Details');
    // Make sure there's a newline after Event Details
    processedText = processedText.replace(/▌\s*Event Details([^\n])/g, '▌ Event Details\n$1');
    
    // Make sure bullet points are on their own lines
    processedText = processedText.replace(/([^\n])•/g, '$1\n•');
  }
  
  // ===== EVENT-SPECIFIC PATTERN FIXES =====
  
  
  // Fix "Event Period" lines
  processedText = processedText.replace(
    /▌\s*Event Period/g,
    '▌ <span style="white-space:nowrap">Event Period</span>'
  );
  
  // Fix "Event Details" lines
  processedText = processedText.replace(
    /▌\s*Event Details/g,
    '▌ <span style="white-space:nowrap">Event Details</span>'
  );
  
  // Fix "Event Rewards" lines
  processedText = processedText.replace(
    /▌\s*Event Rewards/g,
    '▌ <span style="white-space:nowrap">Event Rewards</span>'
  );
  
  // Fix "Participation Requirement" lines
  processedText = processedText.replace(
    /▌\s*Participation Requirement/g,
    '▌ <span style="white-space:nowrap">Participation Requirement</span>'
  );
  
  return processedText;
}

// Complete formatDescription method with improved bullet point handling
private formatDescription(text: string): SafeHtml {
  if (!text) return this.sanitizer.bypassSecurityTrustHtml('');

  console.log('Raw description length:', text.length);
  console.log('Available section images:', this.sectionImages);
  
  // Apply preprocessing to fix broken lines
  text = this.preprocessText(text);
  
  // Check for Event Details content
  const hasEventDetails = text.includes('▌ Event Details') || text.includes('▌Event Details');
  const hasBulletPoints = text.includes('●');
  
  console.log(`Text contains Event Details: ${hasEventDetails}, Bullet Points: ${hasBulletPoints}`);
  
  // Print a snippet of the text around Event Details and bullet points for debugging
  if (hasEventDetails) {
    const eventDetailsIndex = text.indexOf('Event Details');
    const snippet = text.substring(
      Math.max(0, eventDetailsIndex - 10), 
      Math.min(text.length, eventDetailsIndex + 100)
    );
    console.log(`Event Details snippet: "${snippet}"`);
  }
  
  // Enhanced content type detection
  const isVersionUpdate = text.includes('Version Update Details') || 
                         text.includes('Update Details') || 
                         text.includes('New Story') ||
                         /\d+\.\s+New\s+/.test(text) ||
                         (text.includes('New Characters') && text.includes('5-Star')) ||
                         (text.includes('Update Time') && text.includes('Requirement:'));
                          
  const isContractShop = text.includes('Contract Shop Update') || 
                         text.includes('Herta Contract:');
                         
  const isStandardEvent = text.includes('Event Period') && 
                         (text.includes('Event Details') || text.includes('Event Rewards')) &&
                         !isVersionUpdate && !isContractShop;
  
  // More aggressive newline insertion to ensure proper parsing
  let processedText = text;
  
  // Ensure all major sections have proper newlines
  processedText = processedText
    // Add double line breaks before section markers (▌)
    .replace(/([^\n])▌/g, '$1\n\n▌')
    // Add line breaks before subsection markers (■)
    .replace(/([^\n])■/g, '$1\n\n■')
    // Add line breaks before bullet points (●)
    .replace(/([^\n])●/g, '$1\n\n●')
    // Add line breaks after bullet points to ensure content separation
    .replace(/●([^\n]+)([^\n])/g, '●$1\n$2')
    // Add line breaks before notes (※)
    .replace(/([^\n])※/g, '$1\n※');
  
  // Split into lines for processing
  const lines = processedText.split('\n').map(line => line.trim()).filter(line => line);
  
  // Output first 5 lines for debugging
  console.log("First 5 lines after splitting:");
  lines.slice(0, 5).forEach((line, i) => console.log(`Line ${i+1}: ${line}`));
  
  // Process lines into HTML
  let htmlOutput = '';
  
  // Process based on content type
  if (isStandardEvent) {
    // For standard events like "To The Ones That Blaze"
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Section headers with ▌ symbol (Event Period, Participation Requirement, Event Details, etc.)
      if (line.startsWith('▌') || line.includes('▌')) {
        const cleanLine = line.replace('▌', '').trim();
        htmlOutput += `<div class="event-header text-wrapper">${cleanLine}</div>`;
        
        // Store current section to track context
        currentSection = cleanLine;
        
        // IMPROVED: Direct check for Event Rewards section
        if (cleanLine === 'Event Rewards' && this.sectionImages['Event Rewards']) {
          const imageUrl = this.sectionImages['Event Rewards'];
          console.log('Found Event Rewards image:', imageUrl);
          
          htmlOutput += `<div class="section-image-container">
            <img src="${imageUrl}" alt="Event Rewards" class="section-image" 
                 onerror="this.onerror=null; this.src='/assets/images/placeholder.png';">
          </div>`;
        }
        // Keep the flexible matching for other sections
        else {
          // Check if any section name is a close match
          const sectionKey = Object.keys(this.sectionImages).find(
            key => cleanLine.includes(key) || key.includes(cleanLine)
          );
          
          if (sectionKey) {
            console.log(`Found image for section ${cleanLine} via match with ${sectionKey}`);
            const imageUrl = this.sectionImages[sectionKey];
            
            htmlOutput += `<div class="section-image-container">
              <img src="${imageUrl}" alt="${cleanLine}" class="section-image" 
                   onerror="this.onerror=null; this.src='/assets/images/placeholder.png';">
            </div>`;
          }
        }
        
        continue;
      }
      
      // Bullet points with ● symbol
      if (line.startsWith('●') || line.includes('●')) {
        const cleanLine = line.replace('●', '').trim();
        htmlOutput += `<div class="bullet-point text-wrapper">${cleanLine}</div>`;
        continue;
      }
      
      // Event period lines
      if (line.includes('After Version') && line.includes('Update') && 
          (line.includes('UTC+8') || line.includes('—'))) {
        htmlOutput += `<div class="update-requirement text-wrapper">${line}</div>`;
        continue;
      }
      
      // Default case - regular content
      htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
    }
  }
  else if (isVersionUpdate) {
    // For version update details
    let currentSection = '';
    let inDescriptionBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Major headers (Version Update Details, etc.)
      if (line.includes('Version Update Details') || line.includes('Update Details')) {
        htmlOutput += `<div class="event-header text-wrapper">${line}</div>`;
        inDescriptionBlock = false;
        continue;
      }
      
      // MAIN SECTION HEADERS: Match ONLY the exact pattern for numbered main sections
      if (/^\d+\.\s+New\s+[A-Z][a-z]+$/.test(line) || // Pattern like "1. New Story"
          /^\d+\.\s+New\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line) || // Pattern like "1. New Light Cones"
          /^\d+\.\s+Others$/.test(line)) { // Pattern specifically for "6. Others"
        htmlOutput += `<div class="update-section-header text-wrapper">${line}</div>`;
        currentSection = line;
        inDescriptionBlock = false;
        continue;
      }
      
      // Bug Fixes and Adjustments sections
      if (/^▌\s*(Bug Fixes|Adjustments and Optimizations)/.test(line)) {
        htmlOutput += `<div class="event-header text-wrapper">${line}</div>`;
        inDescriptionBlock = false;
        continue;
      }
      
      // AREA/LOCATION NAMES: Generic pattern for area names in quotes followed by descriptions
      if (/^\"[^\"]+\"/.test(line)) {
        // Extract the quoted area name using regex
        const quoteMatch = line.match(/^\"([^\"]+)\"\s*([^\s].+)/);
        if (quoteMatch) {
          // Full area name with quotes
          const quotedAreaName = `"${quoteMatch[1]}"`;
          // Location name after the quoted text
          const locationName = quoteMatch[2];
          
          // Add the full line as a subheader (not bold)
          htmlOutput += `<div class="event-subheader text-wrapper">${quotedAreaName} ${locationName}</div>`;
          
          // Mark that we're now in a description block
          inDescriptionBlock = true;
          continue;
        } else {
          // If we just have a quoted name without location
          const simpleQuoteMatch = line.match(/^\"([^\"]+)\"/);
          if (simpleQuoteMatch) {
            // Get the full quoted text including quotes
            const quotedAreaName = simpleQuoteMatch[0];
            
            // Add the quoted area name as a subheader
            htmlOutput += `<div class="event-subheader text-wrapper">${quotedAreaName}</div>`;
            
            // Then add the remaining text as regular content if any
            const description = line.substring(quotedAreaName.length).trim();
            if (description) {
              htmlOutput += `<div class="update-content text-wrapper">${description}</div>`;
            }
            inDescriptionBlock = true;
            continue;
          }
        }
      }
      
      // Area descriptions (like "The spiritual and political center...")
      if (inDescriptionBlock && 
          (line.startsWith("The spiritual") || 
           line.startsWith("This land of") ||
           line.length > 20)) {
        htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
        continue;
      }
      
      // Handle specific patterns as regular content
      if (
          line.includes("Trailblaze Mission") || 
          line.includes("Castorice is a DPS") ||
          line.includes("Anaxa is a DPS") ||
          line.includes("Obtainable through") ||
          line.startsWith("The spiritual") ||
          line.startsWith("This land of") ||
          line.startsWith("Enemies ") ||
          line.startsWith("Gameplay ") ||
          line.includes("Shadow:") ||
          line.includes("Fiction:") ||
          line.includes("Chaos:") ||
          line.includes("Skill Lv")
      ) {
        htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
        inDescriptionBlock = true;
        continue;
      }
      
      // Character sections (5-Star, 4-Star) - always regular content
      if (line.startsWith('5-Star') || line.startsWith('4-Star') ||
          line.startsWith('■ 5-Star') || line.startsWith('■ 4-Star')) {
        const cleanLine = line.replace(/^[■●]\s*/, '').trim();
        htmlOutput += `<div class="update-content text-wrapper">${cleanLine}</div>`;
        inDescriptionBlock = true;
        continue;
      }
      
      // Other section headers with ■ symbols (not for character descriptions)
      if ((line.startsWith('■') || line.includes('■')) && 
          !line.includes('Star') && !line.includes('character')) {
        const cleanLine = line.replace('■', '').trim();
        htmlOutput += `<div class="event-subheader text-wrapper">${cleanLine}</div>`;
        inDescriptionBlock = false;
        continue;
      }
      
      // Major section headers (▌ symbols), excluding character descriptions
      if ((line.startsWith('▌') || line.includes('▌')) && 
          !line.includes('Star') && !line.includes('character')) {
        const cleanLine = line.replace('▌', '').trim();
        htmlOutput += `<div class="event-header text-wrapper">${cleanLine}</div>`;
        inDescriptionBlock = false;
        continue;
      }
      
      // Event Period/Requirements - special styling
      if (line.includes('Event Period:') || line.includes('Event Period') || 
          line.startsWith('Requirement:') || line.includes('Requirement:')) {
        htmlOutput += `<div class="update-requirement text-wrapper">${line}</div>`;
        continue;
      }
      
      // Other time/date references
      if (line.includes('Update Time') || line.includes('Update Time:')) {
        htmlOutput += `<div class="update-requirement text-wrapper">${line}</div>`;
        continue;
      }
      
      // Notes with ※ symbols
      if (line.startsWith('※') || line.includes('※')) {
        htmlOutput += `<div class="update-note text-wrapper">${line}</div>`;
        continue;
      }
      
      // Bullet points - handle both traditional bullets and bullet point numbers
      if (line.startsWith('●') || line.includes('●') || 
          line.startsWith('.') || line.startsWith('•')) {
        const cleanLine = line.replace(/^[●.•]\s*/, '').trim();
        htmlOutput += `<div class="bullet-point text-wrapper">${cleanLine}</div>`;
        continue;
      }
      
      // Handle any lines that appear to be descriptive content
      if (inDescriptionBlock || 
          line.length > 20 || 
          line.includes(":") ||
          /^[A-Z][a-z]/.test(line)) { // Starts with capital letter followed by lowercase
        htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
        continue;
      }
      
      // Default content fallback
      htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
    }
  } 
  else if (isContractShop) {
    // Contract shop processing logic
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Shop/section header (title with Version update)
      if (line.includes('Version') && (line.includes('Contract Shop Update') || line.includes('Shop Update'))) {
        htmlOutput += `<div class="event-header text-wrapper">${line}</div>`;
        continue;
      }
      
      // Time/period header
      if (line.includes('Release Time') || line.includes('After the Version') || line.includes('Event Period')) {
        htmlOutput += `<div class="release-time text-wrapper">${line}</div>`;
        continue;
      }
      
      // Section headers (■ symbols)
      if (line.startsWith('■') || line.includes('■')) {
        const cleanLine = line.replace('■', '').trim();
        htmlOutput += `<div class="event-subheader text-wrapper">${cleanLine}</div>`;
        continue;
      }
      
      // Major section headers (▌ symbols)
      if (line.startsWith('▌') || line.includes('▌')) {
        const cleanLine = line.replace('▌', '').trim();
        htmlOutput += `<div class="event-header text-wrapper">${cleanLine}</div>`;
        
        // Check for section images
        if (cleanLine === 'Event Rewards' && this.sectionImages['Event Rewards']) {
          const imageUrl = this.sectionImages['Event Rewards'];
          htmlOutput += `<div class="section-image-container">
            <img src="${imageUrl}" alt="Event Rewards" class="section-image" 
                 onerror="this.onerror=null; this.src='/assets/images/placeholder.png';">
          </div>`;
        }
        
        continue;
      }
      
      // Bullet points
      if (line.startsWith('●') || line.includes('●')) {
        const cleanLine = line.replace('●', '').trim();
        htmlOutput += `<div class="bullet-point text-wrapper">${cleanLine}</div>`;
        continue;
      }
      
      // Contract items
      if (line.includes('Herta Contract:')) {
        const contractBlock = this.processContractBlock(lines, i);
        htmlOutput += contractBlock.html;
        i = contractBlock.endIndex; // Skip to the end of this contract block
        continue;
      }
      
      // Default case - regular content
      htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
    }
  }
  else {
    // Default generic processing for other event types
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Section headers (■ symbols)
      if (line.startsWith('■') || line.includes('■')) {
        const cleanLine = line.replace('■', '').trim();
        htmlOutput += `<div class="event-subheader text-wrapper">${cleanLine}</div>`;
        continue;
      }
      
      // Major section headers (▌ symbols)
      if (line.startsWith('▌') || line.includes('▌')) {
        const cleanLine = line.replace('▌', '').trim();
        htmlOutput += `<div class="event-header text-wrapper">${cleanLine}</div>`;
        
        // Check for section images
        if (cleanLine === 'Event Rewards' && this.sectionImages['Event Rewards']) {
          const imageUrl = this.sectionImages['Event Rewards'];
          htmlOutput += `<div class="section-image-container">
            <img src="${imageUrl}" alt="Event Rewards" class="section-image" 
                 onerror="this.onerror=null; this.src='/assets/images/placeholder.png';">
          </div>`;
        }
        
        continue;
      }
      
      // Bullet points
      if (line.startsWith('●') || line.includes('●')) {
        const cleanLine = line.replace('●', '').trim();
        htmlOutput += `<div class="bullet-point text-wrapper">${cleanLine}</div>`;
        continue;
      }
      
      // Default case - regular content
      htmlOutput += `<div class="update-content text-wrapper">${line}</div>`;
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
    htmlOutput += `<div class="contract-header text-wrapper">${contractHeader}</div>`;
    
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
      htmlOutput += `<div class="contract-content text-wrapper">${contractContentLines.join(' ')}</div>`;
    }
    
    // Add price info
    if (priceInfo) {
      htmlOutput += `<div class="price-info text-wrapper">${priceInfo}</div>`;
    }
    
    // Add maximum purchases info
    if (maxPurchases) {
      htmlOutput += `<div class="price-info text-wrapper">${maxPurchases}</div>`;
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