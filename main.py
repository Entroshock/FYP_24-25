
import requests
import json
import time
import re
import random
import os
import traceback
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from transformers import pipeline
import numpy as np

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }

def is_version_update_article(article):
    """Check if this is a version update announcement"""
    title = article.get('title', '').lower()
    description = article.get('description', '').lower()
    
    # Specific patterns that indicate a version update announcement
    update_patterns = [
        'version update',
        'version maintenance',
        'welcome to version'
    ]
    
    return any(pattern in title or pattern in description for pattern in update_patterns)

def add_delay(min_seconds=2, max_seconds=5):
    """Add a random delay between requests to be respectful to the server"""
    delay = random.uniform(min_seconds, max_seconds)
    print(f"\nWaiting {delay:.1f} seconds before next request...")
    time.sleep(delay)

def parse_version_update_time(text):
    """Extract version update time from announcement"""
    # Look for version number
    version_pattern = r"Version (\d+\.\d+)"
    update_time_pattern = r"Begins at (\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})"
    
    version_match = re.search(version_pattern, text)
    time_match = re.search(update_time_pattern, text)
    
    if version_match and time_match:
        version = version_match.group(1)
        update_time = datetime.strptime(time_match.group(1), "%Y/%m/%d %H:%M:%S")
        
        # Add 5 hours for the maintenance period
        start_time = update_time + timedelta(hours=5)
        
        return {
            'version': version,
            'updateStart': update_time.isoformat(),
            'versionStart': start_time.isoformat(),
            'timestamp': int(start_time.timestamp() * 1000)
        }
    
    return None

def parse_event_dates(text, version_updates=None):
    """Extract start and end dates from text with proper version update handling and improved pattern matching"""
    print("\nTrying to parse dates from:")
    print(text[:200] + "..." if len(text) > 200 else text)
    
    # First look for version reference
    version_pattern = r"after the Version (\d+\.\d+) update"
    version_match = re.search(version_pattern, text, re.IGNORECASE)
    
    # Then look for end date - UPDATED to support both en-dash, regular hyphen, and more flexible spacing
    end_date_pattern = r"[–\-]\s*(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})"
    end_date_match = re.search(end_date_pattern, text)
    
    if not end_date_match:
        # Try alternative patterns for end date
        alternative_patterns = [
            r"(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})\s*\(server time\)",  # Look for date with server time mention
            r"Period.*?[–\-].*?(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})",   # Look after "Period" with dash
            r"Event Period.*?[–\-].*?(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})",  # Look after "Event Period"
            r"(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})\s*\(UTC\+8\)",  # Look for date with UTC+8 mention
        ]
        
        for pattern in alternative_patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                print(f"Found end date using alternative pattern: {match.group(1)}")
                end_date_match = match
                break
    
    if not end_date_match:
        print("No end date found using any pattern")
        return None

    try:
        end_date_str = end_date_match.group(1).strip()
        print(f"Extracted end date: {end_date_str}")
        end_date = datetime.strptime(end_date_str, "%Y/%m/%d %H:%M:%S")
        
        # If this mentions a version update and we have version data
        if version_match and version_updates:
            version = version_match.group(1)
            print(f"Found version reference: {version}")
            
            if version in version_updates:
                version_info = version_updates[version]
                # Convert the stored ISO format string back to datetime
                start_date = datetime.fromisoformat(version_info['versionStart'])
                print(f"Using version {version} start time: {start_date}")
                
                # Only return if start date is before end date
                if start_date < end_date:
                    return {
                        'startDate': start_date.isoformat(),
                        'endDate': end_date.isoformat(),
                        'startTimestamp': int(start_date.timestamp() * 1000),
                        'endTimestamp': int(end_date.timestamp() * 1000),
                        'version': version
                    }
                else:
                    print(f"Warning: Version start date {start_date} would be after end date {end_date}")
                    return None
            else:
                print(f"Warning: Version {version} not found in version_updates")
                return None
        
        # IMPROVED: Multiple approaches to find start date
        
        # Approach 1: Look for explicit start-end date pattern
        start_date_patterns = [
            r"(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})\s*[–\-]",  # Standard format with dash
            r"Event Period\s+(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})",  # After Event Period
            r"Period[: ]+(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})",  # After Period:
            r"from after Version.*?until\s+(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})" # From after Version until date
        ]
        
        for pattern in start_date_patterns:
            start_date_match = re.search(pattern, text, re.DOTALL)
            if start_date_match:
                start_date_str = start_date_match.group(1).strip()
                print(f"Found start date using pattern: {start_date_str}")
                start_date = datetime.strptime(start_date_str, "%Y/%m/%d %H:%M:%S")
                
                if start_date < end_date:
                    return {
                        'startDate': start_date.isoformat(),
                        'endDate': end_date.isoformat(),
                        'startTimestamp': int(start_date.timestamp() * 1000),
                        'endTimestamp': int(end_date.timestamp() * 1000)
                    }
                else:
                    print(f"Warning: Start date {start_date} would be after end date {end_date}")
                    continue  # Try next pattern
        
        # Approach 2: Extract all dates and find the one before the end date
        all_dates_pattern = r"(\d{4}/\d{1,2}/\d{1,2}\s+\d{2}:\d{2}:\d{2})"
        all_dates = re.findall(all_dates_pattern, text)
        
        if len(all_dates) >= 2:
            print(f"Found {len(all_dates)} dates in text")
            
            for date_str in all_dates:
                if date_str == end_date_str:
                    continue  # Skip the end date
                    
                try:
                    potential_start = datetime.strptime(date_str, "%Y/%m/%d %H:%M:%S")
                    if potential_start < end_date:
                        print(f"Using date as start: {date_str}")
                        return {
                            'startDate': potential_start.isoformat(),
                            'endDate': end_date.isoformat(),
                            'startTimestamp': int(potential_start.timestamp() * 1000),
                            'endTimestamp': int(end_date.timestamp() * 1000)
                        }
                except ValueError:
                    continue  # Skip invalid dates
        
        # If we still couldn't find a start date, we'll use a fallback approach
        # For events like Planar Fissure, sometimes the start date is mentioned right before the end date
        # Let's try to use the first date as start date if there are at least two dates
        if len(all_dates) >= 2:
            try:
                first_date_str = all_dates[0]
                first_date = datetime.strptime(first_date_str, "%Y/%m/%d %H:%M:%S")
                
                if first_date < end_date:
                    print(f"Using first date as fallback start date: {first_date_str}")
                    return {
                        'startDate': first_date.isoformat(),
                        'endDate': end_date.isoformat(),
                        'startTimestamp': int(first_date.timestamp() * 1000),
                        'endTimestamp': int(end_date.timestamp() * 1000)
                    }
            except ValueError:
                pass  # Ignore parsing errors in fallback
        
        print("No valid start date pattern found")
        return None
                
    except ValueError as e:
        print(f"Error parsing dates: {e}")
        return None
    

def is_event_article(article):
    """Check if the article is about an event"""
    keywords = [
        "Event Period",
        "Period:",
        "▌Event Period",
        "Limited-Time Event",
        "Event Details",
        "Garden of Plenty",
        "Planar Fissure",
        "Warp"
    ]
    
    content_to_check = [
        article.get('title', '').lower(),
        article.get('description', '').lower()
    ]
    
    return any(
        keyword.lower() in text 
        for text in content_to_check 
        for keyword in keywords
    )

def get_article_list(last_id=""):
    """Fetch articles with rate limiting"""
    add_delay()  # Add delay before each request
    
    base_url = "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList"
    params = {
        'gids': '6',
        'page_size': '20',
        'type': '1',
        'last_id': last_id
    }
    
    try:
        response = requests.get(base_url, params=params, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        articles = []
        list_data = data.get('data', {}).get('list', [])
        
        for item in list_data:
            post = item.get('post', {})
            if not post:
                continue
                
            article = {
                'id': post.get('post_id'),
                'title': post.get('subject'),
                'description': post.get('desc'),
                'content': post.get('content')
            }
            
            articles.append(article)
            print(f"Found article: {article['title']}")
            
        return articles, data.get('data', {}).get('last_id', ''), data.get('data', {}).get('is_last', True)
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article list: {e}")
        return [], "", True


def upload_to_firestore(events):
    """Upload events to Firestore with enhanced error handling and debugging"""
    try:
        print("\n--- FIREBASE UPLOAD PROCESS STARTING ---")
        
        # Check if Firebase is already initialized
        firebase_initialized = bool(firebase_admin._apps)
        print(f"Firebase already initialized: {firebase_initialized}")
        
        if not firebase_initialized:
            # Get absolute path of the current script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            service_account_path = os.path.join(current_dir, 'serviceAccountKey.json')
            
            # Check if file exists
            if os.path.exists(service_account_path):
                print(f"Found service account key at: {service_account_path}")
            else:
                print(f"WARNING: Service account key not found at: {service_account_path}")
                # Try alternate locations
                alternate_paths = [
                    './serviceAccountKey.json',
                    '../serviceAccountKey.json',
                    os.path.abspath('serviceAccountKey.json')
                ]
                
                for path in alternate_paths:
                    if os.path.exists(path):
                        print(f"Found service account key at alternate location: {path}")
                        service_account_path = path
                        break
            
            try:
                print(f"Initializing Firebase with credentials from: {service_account_path}")
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized successfully")
            except Exception as init_error:
                print(f"ERROR initializing Firebase: {init_error}")
                traceback.print_exc()
                return False
        
        # Get Firestore client
        try:
            print("Getting Firestore client...")
            db = firestore.client()
            print("Firestore client created successfully")
        except Exception as db_error:
            print(f"ERROR getting Firestore client: {db_error}")
            traceback.print_exc()
            return False
        
        # Upload events
        events_collection = db.collection('events')
        success_count = 0
        
        print(f"\nUploading {len(events)} events to Firestore...")
        for index, event in enumerate(events):
            if not event:
                print(f"Skipping empty event at index {index}")
                continue
                
            try:
                event_id = str(event['eventId'])
                print(f"Uploading event [{index+1}/{len(events)}]: ID={event_id}, Title={event['title']}")
                
                doc_ref = events_collection.document(event_id)
                doc_ref.set(event, merge=True)
                
                success_count += 1
                print(f"Successfully uploaded event: {event['title']}")
            except Exception as event_error:
                print(f"ERROR uploading event {event.get('eventId', 'unknown')}: {event_error}")
        
        print(f"\n--- FIREBASE UPLOAD COMPLETE: {success_count}/{len(events)} events uploaded successfully ---")
        return success_count > 0
                
    except Exception as e:
        print(f"CRITICAL ERROR in upload_to_firestore function: {e}")
        traceback.print_exc()
        return False

def get_article_comments(post_id):
    """Fetch comments for an article"""
    base_url = "https://bbs-api-os.hoyolab.com/community/post/wapi/getPostReplies"
    params = {
        'post_id': post_id,
        'size': 20,  # Adjust size as needed
        'last_id': ''
    }
    
    try:
        response = requests.get(base_url, params=params, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        comments = []
        
        for reply in data.get('data', {}).get('list', []):
            comment = {
                'content': reply.get('reply', {}).get('content', ''),
                'likes': reply.get('reply', {}).get('like_num', 0)
            }
            comments.append(comment)
            
        return comments
    except requests.exceptions.RequestException as e:
        print(f"Error fetching comments: {e}")
        return []

def analyze_sentiment(comments):
    """Analyze sentiment of comments using BERT with improved handling of long texts"""
    # Initialize sentiment analysis pipeline
    sentiment_analyzer = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
    
    if not comments:
        print("No comments to analyze, returning neutral sentiment")
        return "neutral"
    
    # Weight comments by likes
    total_weight = 0
    weighted_scores = 0
    
    for comment in comments:
        comment_text = comment['content']
        
        # Skip empty comments
        if not comment_text or len(comment_text.strip()) == 0:
            continue
        
        # Truncate long comments to avoid BERT token limit issues
        # BERT typically has a 512 token limit, so we'll truncate to be safe
        # A rough estimate is about 3-4 chars per token for many languages
        if len(comment_text) > 1500:  # ~375-500 tokens
            print(f"Truncating comment of length {len(comment_text)} to 1500 characters")
            comment_text = comment_text[:1500]
        
        try:
            # Get sentiment score (1-5)
            result = sentiment_analyzer(comment_text)[0]
            score = int(result['label'].split()[0])  # Convert '1 star' to 1
            
            # Weight by likes (add 1 to avoid zero weights)
            weight = comment['likes'] + 1
            weighted_scores += score * weight
            total_weight += weight
            
        except Exception as e:
            print(f"Error analyzing sentiment for comment: {e}")
            # Continue with next comment instead of failing
            continue
    
    # If no comments were successfully analyzed
    if total_weight == 0:
        print("Could not analyze any comments, returning neutral sentiment")
        return "neutral"
    
    average_score = weighted_scores / total_weight
    
    # Convert to sentiment category
    if average_score >= 4:
        sentiment = "positive"
    elif average_score >= 3:
        sentiment = "neutral"
    else:
        sentiment = "negative"
        
    print(f"Sentiment analysis result: {sentiment} (average score: {average_score:.2f})")
    return sentiment

def get_article_content(post_id):
    """Fetch detailed article content with better structured content parsing"""
    add_delay()  # Add delay before each request
    
    api_url = f"https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id={post_id}&read=1&scene=1"
    
    try:
        response = requests.get(api_url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        post_data = data.get('data', {}).get('post', {}).get('post', {})
        
        # Get image_list from the correct location
        image_list = data.get('data', {}).get('post', {}).get('image_list', [])
        
        # Get basic content fields
        structured_content = post_data.get('structured_content', '')
        desc = post_data.get('desc', '')
        cover = post_data.get('cover', '')
        
        # Get multilanguage content if available
        multi_lang = post_data.get('multi_language_info', {})
        lang_content = multi_lang.get('lang_content', {}).get('en-us', '')
        
        # Parse the structured_content JSON to extract all text properly
        full_text = ""
        if structured_content:
            try:
                content_json = json.loads(structured_content)
                
                # Process each insert block to extract text
                for item in content_json:
                    if 'insert' in item:
                        insert_value = item['insert']
                        
                        # Handle plain text inserts
                        if isinstance(insert_value, str):
                            full_text += insert_value
                        
                        # Handle object inserts (like images or formatted text)
                        elif isinstance(insert_value, dict):
                            # Skip images
                            if 'image' in insert_value:
                                continue
                                
                            # Get text content from other object types
                            if 'text' in insert_value:
                                full_text += insert_value['text']
                                
            except json.JSONDecodeError:
                print(f"Error parsing structured content JSON for post {post_id}")
                # Fall back to unstructured content
                full_text = ' '.join(filter(None, [desc, structured_content, lang_content]))
        else:
            # Fall back to unstructured content
            full_text = ' '.join(filter(None, [desc, lang_content]))
        
        # Clean up any HTML tags that might be in the content
        full_text = re.sub(r'<[^>]+>', ' ', full_text)
        
        # Clean up excess whitespace
        full_text = re.sub(r'\s+', ' ', full_text).strip()
        
        # Ensure section markers and bullet points are properly formatted
        full_text = full_text.replace("▌Event", "▌ Event")
        full_text = full_text.replace("●During", "● During")
        full_text = full_text.replace("●From", "● From")
        full_text = full_text.replace("●If", "● If")
        full_text = full_text.replace("●After", "● After")
        
        print(f"Extracted full text (first 200 chars): {full_text[:200]}...")
        
        return {
            'description': desc,
            'content': structured_content or lang_content,
            'full_text': full_text,
            'structured_content': structured_content,
            'raw_post_data': post_data,
            'image_list': image_list,
            'cover': cover
        }
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article content: {e}")
        return None
    

def format_event_for_firestore(article, dates):
    """Format article data with improved structured content parsing"""
    # Get raw post data for better description and image extraction
    raw_post_data = article.get('raw_post_data', {})
    clean_description = raw_post_data.get('desc', '') or article.get('description', '')
    
    # Get structured content for better parsing
    structured_content = raw_post_data.get('structured_content', '')
    
    # Parse the full event text more carefully
    full_text = article.get('full_text', '')
    
    # If we still don't have good content, try to extract from structured_content JSON
    if not full_text or '●' not in full_text:
        if structured_content:
            try:
                content_json = json.loads(structured_content)
                extracted_text = []
                
                # Extract text from each insert block
                for item in content_json:
                    if 'insert' in item:
                        insert_value = item['insert']
                        if isinstance(insert_value, str):
                            extracted_text.append(insert_value)
                        elif isinstance(insert_value, dict) and 'text' in insert_value:
                            extracted_text.append(insert_value['text'])
                
                # Join all extracted text
                full_text = ''.join(extracted_text)
                
                # Fix common formatting issues
                full_text = full_text.replace("▌Event", "▌ Event")
                full_text = full_text.replace("●During", "● During")
                full_text = full_text.replace("●From", "● From")
                full_text = full_text.replace("●If", "● If")
                full_text = full_text.replace("●After", "● After")
                
                print(f"Successfully parsed structured content for event: {article.get('title')}")
            except json.JSONDecodeError:
                print(f"Failed to parse structured content JSON for: {article.get('title')}")
    
    # Create base event data
    event_data = {
        'eventId': article.get('id'),
        'title': article.get('title'),
        'description': full_text or clean_description,  # Use the full parsed text if available
        'startDate': dates['startDate'],
        'endDate': dates['endDate'],
        'startTimestamp': dates['startTimestamp'],
        'endTimestamp': dates['endTimestamp'],
        'lastUpdated': datetime.now().isoformat()
    }
    
    # Add sentiment analysis
    comments = get_article_comments(article['id'])
    sentiment = analyze_sentiment(comments)
    event_data['sentiment'] = sentiment
    
    # Add version if available
    if 'version' in dates:
        event_data['version'] = dates['version']
    
    # Image extraction (keep existing image extraction logic)
    # ...
    
    return event_data


def scrape_hoyolab(article_limit=10):
    """Main scraping function with two-pass processing and image extraction"""
    all_articles = []
    formatted_events = []
    version_updates = {}
    last_id = ""
    is_last = False
    page_count = 0
    
    # First pass: Get all articles and process version updates
    print("\nFirst pass: Processing version updates...")
    while not is_last and page_count < 10:
        page_count += 1
        print(f"\nFetching page {page_count} for version updates...")
        articles, new_last_id, is_last = get_article_list(last_id)
        
        if not articles:
            break
            
        for article in articles:
            print(f"Checking article: {article['title']}")
            if is_version_update_article(article):
                print(f"Found version update article: {article['title']}")
                content = get_article_content(article['id'])
                if content:
                    article.update(content)
                    version_info = parse_version_update_time(article.get('full_text', ''))
                    if version_info:
                        version = version_info['version']
                        version_updates[version] = version_info
                        print(f"Found version {version} start time: {version_info['versionStart']}")
            
            all_articles.append(article)
            
        last_id = new_last_id
    
    # Second pass: Process event articles with version information
    print("\nSecond pass: Processing event articles...")
    event_count = 0
    image_count = 0  # Track how many events have images
    
    for article in all_articles:
        if event_count >= article_limit:
            break
            
        if is_event_article(article):
            print(f"\nProcessing event article: {article['title']}")
            content = get_article_content(article['id']) if 'full_text' not in article else None
            
            if content:
                article.update(content)
                
            dates = parse_event_dates(article.get('full_text', ''), version_updates)
            if dates:
                formatted_event = format_event_for_firestore(article, dates)
                if formatted_event:
                    # Check if the event has an image
                    if 'imageUrl' in formatted_event:
                        image_count += 1
                        
                    formatted_events.append(formatted_event)
                    print(f"Successfully processed event: {article['title']}")
                    event_count += 1
            else:
                print(f"Could not parse dates for: {article['title']}")
    
    # Print summary
    print(f"\n===== SCRAPING SUMMARY =====")
    print(f"Total events processed: {len(formatted_events)}")
    print(f"Events with images: {image_count}")
    print(f"Events without images: {len(formatted_events) - image_count}")
    
    # Save formatted events
    if formatted_events:
        with open('formatted_events.json', 'w', encoding='utf-8') as f:
            json.dump(formatted_events, f, ensure_ascii=False, indent=2)
        print(f"Saved all events to formatted_events.json")
    
    return formatted_events

if __name__ == "__main__":
    # Scrape events with increased limit
    events = scrape_hoyolab(article_limit=20)
    print(f"\nSuccessfully processed {len(events)} events")
    
    if events:
        # Save to JSON file
        with open('formatted_events.json', 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=2)
        print(f"Saved events to {os.path.abspath('formatted_events.json')}")
        
        # Count events with images
        events_with_images = sum(1 for event in events if 'imageUrl' in event)
        print(f"Events with images: {events_with_images}/{len(events)}")
        
        # Try uploading to Firestore with improved function
        upload_success = upload_to_firestore(events)
        
        if not upload_success:
            print("\n⚠️ WARNING: Failed to upload events to Firestore!")
            print("The calendar view may not update until Firestore upload is successful.")
        else:
            print("\n✅ Events uploaded to Firestore successfully!")