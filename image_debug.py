import os
import json
import requests
from urllib.parse import urlparse

def debug_image_process():
    print("\n===== IMAGE DEBUGGING PROCESS =====\n")
    
    # 1. Check if formatted_events.json exists
    if os.path.exists('formatted_events.json'):
        print(f"Found formatted_events.json at {os.path.abspath('formatted_events.json')}")
        
        try:
            with open('formatted_events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
                print(f"Loaded {len(events)} events from file")
        except Exception as e:
            print(f"Error loading events JSON: {e}")
            return
    else:
        print("WARNING: formatted_events.json not found!")
        print(f"Current directory: {os.getcwd()}")
        print(f"Files in current directory: {os.listdir('.')}")
        return
    
    # 2. Check directories
    target_dir = 'src/assets/images/events'
    if not os.path.exists(target_dir):
        print(f"Creating directory path: {os.path.abspath(target_dir)}")
        try:
            os.makedirs(target_dir, exist_ok=True)
            print(f"Successfully created directory: {os.path.abspath(target_dir)}")
        except Exception as e:
            print(f"ERROR creating directory: {e}")
            print("Attempting to create directories one by one...")
            
            # Try creating each level
            if not os.path.exists('src'):
                os.mkdir('src')
                print("Created 'src' directory")
            
            if not os.path.exists('src/assets'):
                os.mkdir('src/assets')
                print("Created 'src/assets' directory")
            
            if not os.path.exists('src/assets/images'):
                os.mkdir('src/assets/images')
                print("Created 'src/assets/images' directory")
            
            if not os.path.exists('src/assets/images/events'):
                os.mkdir('src/assets/images/events')
                print("Created 'src/assets/images/events' directory")
    else:
        print(f"Directory already exists: {os.path.abspath(target_dir)}")
    
    # 3. Fetch an event for testing
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }
    
    print("\nTesting image extraction from API...")
    
    # Get first event ID for testing
    if events and len(events) > 0:
        test_event_id = events[0]['eventId']
        print(f"Using event ID for test: {test_event_id}")
        
        try:
            # Fetch article content
            api_url = f"https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id={test_event_id}&read=1&scene=1"
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            post_data = data.get('data', {}).get('post', {}).get('post', {})
            
            # Check for images in image_list
            image_list = post_data.get('image_list', [])
            if image_list and len(image_list) > 0:
                print(f"Found {len(image_list)} images in image_list")
                test_image_url = image_list[0].get('url')
                if test_image_url:
                    print(f"First image URL: {test_image_url}")
                    
                    # Try downloading the image
                    try:
                        parsed_url = urlparse(test_image_url)
                        path = parsed_url.path
                        ext = os.path.splitext(path)[1] or '.jpg'
                        
                        test_filename = f"src/assets/images/events/test_image{ext}"
                        print(f"Downloading test image to: {os.path.abspath(test_filename)}")
                        
                        img_response = requests.get(test_image_url, stream=True)
                        img_response.raise_for_status()
                        
                        with open(test_filename, 'wb') as f:
                            for chunk in img_response.iter_content(chunk_size=8192):
                                f.write(chunk)
                        
                        print(f"Successfully downloaded test image! File exists: {os.path.exists(test_filename)}")
                        print(f"File size: {os.path.getsize(test_filename)} bytes")
                    except Exception as e:
                        print(f"Error downloading test image: {e}")
                else:
                    print("No URL found in first image")
            else:
                print("No images found in image_list")
            
            # Check structured_content
            structured_content = post_data.get('structured_content', '')
            if structured_content:
                print("\nChecking structured_content for images...")
                try:
                    content_data = json.loads(structured_content)
                    if isinstance(content_data, list):
                        image_count = 0
                        for item in content_data:
                            if isinstance(item, dict) and 'insert' in item:
                                insert_value = item.get('insert')
                                if isinstance(insert_value, dict) and insert_value.get('type') == 'image':
                                    image_count += 1
                                    image_url = insert_value.get('attributes', {}).get('src')
                                    if image_url and image_count == 1:
                                        print(f"Found image in structured_content: {image_url}")
                                        
                                        # Try downloading this image too
                                        try:
                                            parsed_url = urlparse(image_url)
                                            path = parsed_url.path
                                            ext = os.path.splitext(path)[1] or '.jpg'
                                            
                                            test_filename = f"src/assets/images/events/test_structured_image{ext}"
                                            print(f"Downloading structured content image to: {os.path.abspath(test_filename)}")
                                            
                                            img_response = requests.get(image_url, stream=True)
                                            img_response.raise_for_status()
                                            
                                            with open(test_filename, 'wb') as f:
                                                for chunk in img_response.iter_content(chunk_size=8192):
                                                    f.write(chunk)
                                            
                                            print(f"Successfully downloaded structured content image! File exists: {os.path.exists(test_filename)}")
                                            print(f"File size: {os.path.getsize(test_filename)} bytes")
                                        except Exception as e:
                                            print(f"Error downloading structured content image: {e}")
                        
                        print(f"Found {image_count} images in structured_content")
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing structured_content: {e}")
                    print(f"First 100 chars of structured_content: {structured_content[:100]}")
        except Exception as e:
            print(f"Error fetching test event: {e}")
    else:
        print("No events found for testing")
    
    # 4. Check if any images were already downloaded
    if os.path.exists(target_dir):
        files = os.listdir(target_dir)
        print(f"\nFiles in {target_dir}: {files}")
        if files:
            print(f"Found {len(files)} files in the target directory")
        else:
            print("No files found in the target directory")
    
    print("\n===== END OF IMAGE DEBUGGING PROCESS =====")

if __name__ == "__main__":
    debug_image_process()