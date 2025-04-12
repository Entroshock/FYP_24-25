import requests
import json
import os
import time
import random
from urllib.parse import urlparse

def get_headers():
    """Get request headers to mimic a browser"""
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }

def add_delay(min_seconds=1, max_seconds=2):
    """Add a random delay between requests to be respectful to the server"""
    delay = random.uniform(min_seconds, max_seconds)
    print(f"Waiting {delay:.1f} seconds before next request...")
    time.sleep(delay)

def test_image_extraction(post_id):
    """Test image extraction for a single post ID"""
    print(f"\n===== TESTING IMAGE EXTRACTION FOR POST ID: {post_id} =====")
    
    api_url = f"https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id={post_id}&read=1&scene=1"
    
    try:
        print("Sending API request...")
        response = requests.get(api_url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        
        # Extract key parts of the response for inspection
        post_data = data.get('data', {}).get('post', {}).get('post', {})
        image_list = data.get('data', {}).get('post', {}).get('image_list', [])
        cover = post_data.get('cover', '')
        
        # Print key information
        print("\n----- API RESPONSE STRUCTURE -----")
        print(f"Status code: {response.status_code}")
        print(f"Response size: {len(response.text)} bytes")
        
        print("\n----- IMAGE SOURCES -----")
        
        # METHOD 1: Check image_list
        print("\n1. Checking image_list:")
        if image_list:
            print(f"  Found {len(image_list)} images in image_list")
            for i, img in enumerate(image_list):
                print(f"  Image {i+1}: {img.get('url')}")
                print(f"  Size: {img.get('width')}x{img.get('height')}, Format: {img.get('format')}")
        else:
            print("  No images found in image_list")
        
        # METHOD 2: Check cover field
        print("\n2. Checking cover field:")
        if cover:
            print(f"  Found cover image: {cover}")
        else:
            print("  No cover image found")
        
        # METHOD 3: Check structured_content
        print("\n3. Checking structured_content:")
        structured_content = post_data.get('structured_content', '')
        
        if structured_content:
            try:
                content_data = json.loads(structured_content)
                image_count = 0
                
                if isinstance(content_data, list):
                    for item in content_data:
                        if isinstance(item, dict) and 'insert' in item:
                            insert_value = item.get('insert')
                            if isinstance(insert_value, dict) and insert_value.get('type') == 'image':
                                image_url = insert_value.get('attributes', {}).get('src')
                                if image_url:
                                    image_count += 1
                                    print(f"  Image {image_count}: {image_url}")
                
                if image_count == 0:
                    print("  No images found in structured_content")
                else:
                    print(f"  Found {image_count} images in structured_content")
                    
            except (json.JSONDecodeError, TypeError) as e:
                print(f"  Error parsing structured_content: {e}")
        else:
            print("  No structured_content found")
        
        # Find the best image to use
        print("\n----- BEST IMAGE TO USE -----")
        image_url = None
        source = None
        
        # Try image_list first
        if image_list and len(image_list) > 0:
            image_url = image_list[0].get('url')
            source = "image_list"
        
        # Try cover next
        if not image_url and cover:
            image_url = cover
            source = "cover"
        
        # Try structured_content last
        if not image_url and structured_content:
            try:
                content_data = json.loads(structured_content)
                if isinstance(content_data, list):
                    for item in content_data:
                        if isinstance(item, dict) and 'insert' in item:
                            insert_value = item.get('insert')
                            if isinstance(insert_value, dict) and insert_value.get('type') == 'image':
                                image_url = insert_value.get('attributes', {}).get('src')
                                if image_url:
                                    source = "structured_content"
                                    break
            except:
                pass
        
        if image_url:
            print(f"Best image found in {source}: {image_url}")
            
            # Try downloading the image
            print("\n----- DOWNLOADING IMAGE -----")
            try:
                # Create directory if it doesn't exist
                os.makedirs('test_images', exist_ok=True)
                
                # Parse URL to get file extension
                parsed_url = urlparse(image_url)
                path = parsed_url.path
                ext = os.path.splitext(path)[1]
                if not ext:
                    ext = '.jpg'  # Default to .jpg if no extension
                
                # Save to test directory
                local_filename = f"test_images/test_image_{post_id}{ext}"
                
                img_response = requests.get(image_url, stream=True)
                img_response.raise_for_status()
                
                with open(local_filename, 'wb') as f:
                    for chunk in img_response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"Successfully downloaded image to: {os.path.abspath(local_filename)}")
                print(f"Image would be stored at: /assets/images/events/event_{post_id}{ext}")
            except Exception as e:
                print(f"Error downloading image: {e}")
        else:
            print("No suitable image found for this post")
        
        print("\n===== TEST COMPLETE =====")
        
    except Exception as e:
        print(f"Error testing image extraction: {e}")

# Example usage
if __name__ == "__main__":
    print("===== IMAGE EXTRACTION TEST SCRIPT =====")
    post_id = input("Enter a post ID to test (e.g., 38119901): ")
    test_image_extraction(post_id)