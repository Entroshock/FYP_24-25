import requests
import json
import time
from datetime import datetime

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }

def is_event_article(article):
    """
    Check if the article is about an event by looking for specific keywords
    in the title and description
    """
    keywords = [
        "Event Period",
        "Period:",  # Common in event posts
        "▌Event Period",  # Specific format used in event posts
        "Limited-Time Event",
        "Event Details",
        "Garden of Plenty",  # Common event names
        "Planar Fissure",
        "Warp"  # Banner events
    ]
    
    # Check both title and description for keywords
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
                
            created_at = post.get('created_at')
            if created_at:
                created_at = datetime.fromtimestamp(created_at).strftime('%Y-%m-%d %H:%M:%S')
            
            article = {
                'id': post.get('post_id'),
                'title': post.get('subject'),
                'created_at': created_at,
                'content': post.get('content'),
                'description': post.get('desc')
            }
            
            # Only add articles that match our event criteria
            if is_event_article(article):
                articles.append(article)
                print(f"Found event article: {article['title']}")
            else:
                print(f"Skipping non-event article: {article['title']}")
            
        return articles, data.get('data', {}).get('last_id', ''), data.get('data', {}).get('is_last', True)
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article list: {e}")
        return [], "", True

def get_article_content(post_id):
    api_url = f"https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id={post_id}&read=1&scene=1"
    
    try:
        response = requests.get(api_url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        post_data = data.get('data', {}).get('post', {}).get('post', {})
        
        return {
            'description': post_data.get('desc', ''),
            'content': post_data.get('content', ''),
            'created_at': datetime.fromtimestamp(post_data.get('created_at', 0)).strftime('%Y-%m-%d %H:%M:%S')
        }
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching article content: {e}")
        return None

def scrape_hoyolab(article_limit=10, max_pages=10):
    """
    Main function to scrape HoYoLAB event articles
    
    Parameters:
        article_limit (int): Maximum number of event articles to scrape. Default is 10.
        max_pages (int): Maximum number of pages to check. Default is 10.
    """
    all_articles = []
    last_id = ""
    is_last = False
    page_count = 0
    
    while not is_last and len(all_articles) < article_limit and page_count < max_pages:
        page_count += 1
        print(f"\nFetching page {page_count} (found {len(all_articles)}/{article_limit} event articles)...")
        articles, new_last_id, is_last = get_article_list(last_id)
        
        if not articles:
            print("No more articles found")
            break
        
        for article in articles:
            if len(all_articles) >= article_limit:
                break
                
            print(f"Processing article: {article['title']}")
            
            content = get_article_content(article['id'])
            if content:
                article.update(content)
            
            all_articles.append(article)
            time.sleep(10)  # Be nice to the server
        
        last_id = new_last_id
    
    # Save results to a file
    if all_articles:
        with open('hoyolab_event_articles.json', 'w', encoding='utf-8') as f:
            json.dump(all_articles, f, ensure_ascii=False, indent=2)
        print(f"\nSaved {len(all_articles)} event articles to hoyolab_event_articles.json")
    
    return all_articles

if __name__ == "__main__":
    # Scrape event articles
    scraped_articles = scrape_hoyolab(article_limit=10)
    print(f"\nSuccessfully scraped {len(scraped_articles)} event articles")
    
    if scraped_articles:
        print("\nSample of first article:")
        article = scraped_articles[0]
        print(f"Title: {article['title']}")
        print(f"Date: {article['created_at']}")
        print(f"Description: {article['description'][:200]}...")