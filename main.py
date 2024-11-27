import requests
import json
import time
import re
from datetime import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }

def parse_event_dates(text):
    """Extract start and end dates from text"""
    # Print the text we're trying to parse
    print("\nTrying to parse dates from:")
    print(text[:200])
    
    # First, look for the event period section
    event_period_pattern = r"▌Event Period[^\d]*((?:\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})[^\d]*(?:\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2}))"
    period_match = re.search(event_period_pattern, text, re.IGNORECASE)
    
    if period_match:
        # Now extract the two dates from the event period section
        date_pattern = r"(\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})"
        dates = re.findall(date_pattern, period_match.group(1))
        
        if len(dates) >= 2:
            try:
                start_date = datetime.strptime(dates[0], "%Y/%m/%d %H:%M:%S")
                end_date = datetime.strptime(dates[1], "%Y/%m/%d %H:%M:%S")
                
                return {
                    'startDate': start_date.isoformat(),
                    'endDate': end_date.isoformat(),
                    'startTimestamp': int(start_date.timestamp() * 1000),
                    'endTimestamp': int(end_date.timestamp() * 1000)
                }
            except ValueError as e:
                print(f"Error parsing dates: {e}")
                print(f"Date strings: {dates}")
                return None
    
    # If no event period section found, try finding any date range
    date_range_pattern = r"(\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})\s*[–-]\s*(\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})"
    date_range_match = re.search(date_range_pattern, text)
    
    if date_range_match:
        try:
            start_date = datetime.strptime(date_range_match.group(1), "%Y/%m/%d %H:%M:%S")
            end_date = datetime.strptime(date_range_match.group(2), "%Y/%m/%d %H:%M:%S")
            
            return {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'startTimestamp': int(start_date.timestamp() * 1000),
                'endTimestamp': int(end_date.timestamp() * 1000)
            }
        except ValueError as e:
            print(f"Error parsing dates: {e}")
            return None
    
    print("No date patterns found in text")
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
    """Fetch articles from the API"""
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
            
            if is_event_article(article):
                articles.append(article)
                print(f"Found event article: {article['title']}")
            else:
                print(f"Skipping non-event article: {article['title']}")
            
        return articles, data.get('data', {}).get('last_id', ''), data.get('data', {}).get('is_last', True)
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article list: {e}")
        return [], "", True

def format_event_for_firestore(article):
    """Format article data for Firestore with clean description"""
    raw_post_data = article.get('raw_post_data', {})
    
    # Get clean description (original short description)
    clean_description = raw_post_data.get('desc', '') or article.get('description', '')
    
    # Combine all possible content sources for date parsing
    content_sources = [
        article.get('full_text', ''),
        article.get('content', ''),
        article.get('structured_content', ''),
        raw_post_data.get('content', ''),
        raw_post_data.get('desc', '')
    ]
    
    # Try parsing dates from each source
    dates = None
    for source in content_sources:
        if source:
            dates = parse_event_dates(source)
            if dates:
                break
    
    if not dates:
        print(f"Could not parse dates for article: {article.get('title')}")
        return None
        
    return {
        'eventId': article.get('id'),
        'title': article.get('title'),
        'description': clean_description,  # Use clean description only
        'startDate': dates['startDate'],
        'endDate': dates['endDate'],
        'startTimestamp': dates['startTimestamp'],
        'endTimestamp': dates['endTimestamp'],
        'lastUpdated': datetime.now().isoformat()
    }

def upload_to_firestore(events):
    """Upload events to Firestore"""
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate('./serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        events_collection = db.collection('events')
        
        for event in events:
            if event:
                doc_ref = events_collection.document(str(event['eventId']))
                doc_ref.set(event, merge=True)
                print(f"Uploaded event: {event['title']}")
                
    except Exception as e:
        print(f"Error uploading to Firestore: {e}")


def get_article_content(post_id):
    """Fetch detailed article content using the API endpoint"""
    api_url = f"https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id={post_id}&read=1&scene=1"
    
    try:
        response = requests.get(api_url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        post_data = data.get('data', {}).get('post', {}).get('post', {})
        
        # Check for multi-language content
        multi_lang = post_data.get('multi_language_info', {})
        structured_content = post_data.get('structured_content', '')
        
        # Try to get content from different possible sources
        content = None
        
        # First try structured content
        if structured_content:
            content = structured_content
        
        # Then try multi-language content
        if not content:
            lang_content = multi_lang.get('lang_content', {}).get('en-us', '')
            if lang_content:
                content = lang_content
        
        # Finally try the desc field
        desc = post_data.get('desc', '')
        
        # Combine all available content
        full_text = ' '.join(filter(None, [desc, content]))
        
        # Debug print
        print(f"\nFull article content:")
        print(json.dumps(post_data, indent=2))
        
        return {
            'description': desc,
            'content': content,
            'full_text': full_text,
            'structured_content': structured_content,
            'raw_post_data': post_data  # Keep the raw data for debugging
        }
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article content: {e}")
        if hasattr(e, 'response') and hasattr(e.response, 'text'):
            print(f"Error response: {e.response.text}")
        return None


def scrape_hoyolab(article_limit=10):
    """Main scraping function"""
    all_articles = []
    formatted_events = []
    last_id = ""
    is_last = False
    page_count = 0
    
    while not is_last and len(all_articles) < article_limit and page_count < 10:
        page_count += 1
        print(f"\nFetching page {page_count} (found {len(all_articles)}/{article_limit} event articles)...")
        articles, new_last_id, is_last = get_article_list(last_id)
        
        if not articles:
            break
        
        for article in articles:
            if len(all_articles) >= article_limit:
                break
                
            print(f"Processing article: {article['title']}")
            
            # Get detailed content
            content = get_article_content(article['id'])
            print(f"\nRaw API response for {article['title']}:")
            print(json.dumps(content, indent=2))
            if content:
                article.update(content)
                # Use the full text for date parsing
                article['description'] = article.get('full_text', '')
            
            formatted_event = format_event_for_firestore(article)
            if formatted_event:
                formatted_events.append(formatted_event)
                print(f"Successfully processed event: {article['title']}")
            else:
                print(f"Could not process dates for: {article['title']}")
            
            all_articles.append(article)
            time.sleep(10)
        
        last_id = new_last_id
    
    # Save both raw and formatted data
    if all_articles:
        with open('raw_articles.json', 'w', encoding='utf-8') as f:
            json.dump(all_articles, f, ensure_ascii=False, indent=2)
            
    if formatted_events:
        with open('formatted_events.json', 'w', encoding='utf-8') as f:
            json.dump(formatted_events, f, ensure_ascii=False, indent=2)
        
        # Upload to Firestore
        upload_to_firestore(formatted_events)
    
    return formatted_events

if __name__ == "__main__":
    events = scrape_hoyolab(article_limit=10)
    print(f"\nSuccessfully processed {len(events)} events")
    
    if events:
        print("\nSample of first event:")
        event = events[0]
        print(f"Title: {event['title']}")
        print(f"Start Date: {event['startDate']}")
        print(f"End Date: {event['endDate']}")