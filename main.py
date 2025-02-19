
import requests
import json
import time
import re
import random
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
        'paean of era nova',  # Specific to current version
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
    """Extract start and end dates from text with proper version update handling"""
    print("\nTrying to parse dates from:")
    print(text[:200])
    
    # First look for version reference
    version_pattern = r"after the Version (\d+\.\d+) update"
    version_match = re.search(version_pattern, text, re.IGNORECASE)
    
    # Then look for end date
    end_date_pattern = r"–\s*(\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})"
    end_date_match = re.search(end_date_pattern, text)
    
    if not end_date_match:
        print("No end date found")
        return None

    try:
        end_date = datetime.strptime(end_date_match.group(1), "%Y/%m/%d %H:%M:%S")
        
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
        
        # If no version reference or no version data, look for explicit start date
        start_date_pattern = r"(\d{4}/\d{1,2}/\d{1,2} \d{2}:\d{2}:\d{2})\s*[–-]"
        start_date_match = re.search(start_date_pattern, text)
        
        if start_date_match:
            start_date = datetime.strptime(start_date_match.group(1), "%Y/%m/%d %H:%M:%S")
            if start_date < end_date:
                return {
                    'startDate': start_date.isoformat(),
                    'endDate': end_date.isoformat(),
                    'startTimestamp': int(start_date.timestamp() * 1000),
                    'endTimestamp': int(end_date.timestamp() * 1000)
                }
            else:
                print(f"Warning: Explicit start date {start_date} would be after end date {end_date}")
                return None
        
        print("No valid start date pattern found and no version update information available")
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

def format_event_for_firestore(article, dates):

    """Format article data with sentiment analysis"""
    # Get existing event data
    event_data = {
        'eventId': article.get('id'),
        'title': article.get('title'),
        'description': article.get('description', ''),
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
    
    return event_data

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
    """Analyze sentiment of comments using BERT"""
    # Initialize sentiment analysis pipeline
    sentiment_analyzer = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
    
    if not comments:
        return "neutral"
    
    # Weight comments by likes
    total_weight = 0
    weighted_scores = 0
    
    for comment in comments:
        # Get sentiment score (1-5)
        result = sentiment_analyzer(comment['content'])[0]
        score = int(result['label'].split()[0])  # Convert '1 star' to 1
        
        # Weight by likes (add 1 to avoid zero weights)
        weight = comment['likes'] + 1
        weighted_scores += score * weight
        total_weight += weight
    
    average_score = weighted_scores / total_weight
    
    # Convert to sentiment category
    if average_score >= 4:
        return "positive"
    elif average_score >= 3:
        return "neutral"
    else:
        return "negative"

def get_article_content(post_id):
    """Fetch detailed article content with rate limiting"""
    add_delay()  # Add delay before each request
    
    api_url = f"https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id={post_id}&read=1&scene=1"
    
    try:
        response = requests.get(api_url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        post_data = data.get('data', {}).get('post', {}).get('post', {})
        
        # Try to get content from different possible sources
        structured_content = post_data.get('structured_content', '')
        desc = post_data.get('desc', '')
        multi_lang = post_data.get('multi_language_info', {})
        lang_content = multi_lang.get('lang_content', {}).get('en-us', '')
        
        # Combine all available content
        full_text = ' '.join(filter(None, [desc, structured_content, lang_content]))
        
        return {
            'description': desc,
            'content': structured_content or lang_content,
            'full_text': full_text,
            'structured_content': structured_content,
            'raw_post_data': post_data
        }
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article content: {e}")
        return None

def scrape_hoyolab(article_limit=10):
    """Main scraping function with two-pass processing"""
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
    for article in all_articles:
        if event_count >= article_limit:
            break
            
        if is_event_article(article):
            print(f"Processing event article: {article['title']}")
            content = get_article_content(article['id']) if 'full_text' not in article else None
            
            if content:
                article.update(content)
                
            dates = parse_event_dates(article.get('full_text', ''), version_updates)
            if dates:
                formatted_event = format_event_for_firestore(article, dates)
                if formatted_event:
                    formatted_events.append(formatted_event)
                    print(f"Successfully processed event: {article['title']}")
                    event_count += 1
            else:
                print(f"Could not parse dates for: {article['title']}")
    
    # Save formatted events
    if formatted_events:
        with open('formatted_events.json', 'w', encoding='utf-8') as f:
            json.dump(formatted_events, f, ensure_ascii=False, indent=2)
        
        # Upload to Firestore
        upload_to_firestore(formatted_events)
    
    return formatted_events

def format_event_for_firestore(article, dates):
    """Format article data with validated dates"""
    raw_post_data = article.get('raw_post_data', {})
    clean_description = raw_post_data.get('desc', '') or article.get('description', '')
    
    event_data = {
        'eventId': article.get('id'),
        'title': article.get('title'),
        'description': clean_description,
        'startDate': dates['startDate'],
        'endDate': dates['endDate'],
        'startTimestamp': dates['startTimestamp'],
        'endTimestamp': dates['endTimestamp'],
        'lastUpdated': datetime.now().isoformat()
    }
    
    # Add version if available
    if 'version' in dates:
        event_data['version'] = dates['version']
    
    return event_data

if __name__ == "__main__":
    events = scrape_hoyolab(article_limit=10)
    print(f"\nSuccessfully processed {len(events)} events")
    
    if events:
        print("\nSample of first event:")
        event = events[0]
        print(f"Title: {event['title']}")
        print(f"Start Date: {event['startDate']}")
        print(f"End Date: {event['endDate']}")