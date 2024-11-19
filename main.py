import requests
import csv
from bs4 import BeautifulSoup
from dateutil import parser
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

BASE_URL = "https://www.hoyolab.com"

def fetch_html(url):
    try:
        
        chromedriver_path =  os.path.join(os.path.dirname(__file__), 'chromedriver-win64', 'chromedriver.exe')  
        service = Service(executable_path=chromedriver_path)
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        driver = webdriver.Chrome(service=service, options=options)

        driver.get(url)
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".mhy-news-card__info"))
        )
        html = driver.page_source
        driver.quit()
        return html
    except Exception as e:
        print(f"Error fetching HTML: {e}")
        return None


def parse_event_data(html):
    """
    Parses event data to extract title and date.

    Args:
        html: The HTML content as a string.

    Returns:
        A list of dictionaries, each containing the title and date of an event.
    """
    soup = BeautifulSoup(html, "html.parser")
    event_cards = soup.select(".mhy-news-card__info")  # Select all event cards
    event_data = []

    for card in event_cards:
        # Extract title
        title_element = card.select_one(".mhy-news-card__title span")
        title = title_element.text.strip() if title_element else "No title"

        # Extract date
        date_element = card.select_one(".mhy-news-card__time")
        date = date_element.text.strip() if date_element else "No date"

        # Append event data
        event_data.append({
            "name": title,
            "date": date,
        })

    return event_data


def get_absolute_url(relative_url):
    if relative_url.startswith("http"):
        return relative_url
    return f"{BASE_URL}{relative_url}"

def store_data_csv(data, filename="events.csv"):
    """
    Stores event data in a CSV file.

    Args:
        data: A list of dictionaries containing event data.
        filename: The name of the CSV file.
    """
    if not data:
        print("No data to write to CSV.")
        return

    with open(filename, "w", newline="", encoding="utf-8") as csvfile:
        fieldnames = data[0].keys()
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(data)

    print(f"Data successfully stored in {filename}.")



def scrape_articles(event_data):
    """
    Scrapes content for each article based on its link.

    Args:
      event_data: A list of event dictionaries, each with a 'link'.

    Returns:
      The event data list with article content added.
    """
    enriched_data = []
    for event in event_data:
        link = event.get("link")
        if not link:
            continue
        
        print(f"Scraping article: {link}")
        article_content = scrape_article_content(link)
        
        if article_content:
            event["article_title"] = article_content.get("title", "")
            event["article_content"] = article_content.get("content", "")
        
        enriched_data.append(event)
        time.sleep(random.uniform(1, 3))  # Avoid overloading the server
    return enriched_data



def clean_event_data(data):
  """
  Cleans event data by handling missing values, 
  standardizing formats, and removing duplicates.

  Args:
    data: A list of dictionaries, where each dictionary represents an event.

  Returns:
    A list of cleaned event dictionaries.
  """
  cleaned_data = []
  seen_events = set()
  for event in data:
    # 1. Handle Missing Data (Example: Remove if date is missing)
    if not event.get("date"):
      continue

    # 2. Standardize Formats (Example: Date parsing)
    try:
      event["date"] = parser.parse(event["date"]).strftime("%Y-%m-%d")
    except ValueError:
      # Handle parsing errors if needed
      pass

    # 3. Clean HTML Artifacts (Example: Remove HTML tags)
    event["name"] = re.sub('<[^<]+?>', '', event["name"])

    # 4. Remove Duplicates (Example: using name and date as key)
    event_key = (event["name"], event["date"])
    if event_key not in seen_events:
      cleaned_data.append(event)
      seen_events.add(event_key)

  return cleaned_data



url = "https://www.hoyolab.com/circles/6/39/official?page_type=39&page_sort=notices"
html = fetch_html(url)

if html:
    event_data = parse_event_data(html)
    
    # Save data to CSV
    store_data_csv(event_data, filename="events.csv")
    
    print("Scraped event data saved to events.csv.")
else:
    print("Failed to fetch the page.")


