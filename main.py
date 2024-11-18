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
        
        chromedriver_path =   
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
    soup = BeautifulSoup(html, "html.parser")
    event_cards = soup.select(".mhy-news-card__info")  # Updated selector
    event_data = []

    for card in event_cards:
        # Extract title
        title_element = card.select_one(".mhy-news-card__title span")
        title = title_element.text.strip() if title_element else "No title"

        # Extract date
        date_element = card.select_one(".mhy-news-card__time")
        date = date_element.text.strip() if date_element else "No date"

        # Extract image URL
        cover_element = card.find_next_sibling("div", class_="mhy-news-card__cover")
        image_element = cover_element.select_one(".mhy-news-card__img") if cover_element else None
        if image_element:
            style = image_element.get("style", "")
            image_url = style.split("url(")[-1].split(")")[0].strip('"') if "url(" in style else None
        else:
            image_url = None

        # Append event data
        event_data.append({
            "name": title,
            "date": date,
            "image_url": image_url
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
    data: A list of dictionaries, where each dictionary represents an event.
    filename: The name of the CSV file to store the data in.
  """
  with open(filename, "w", newline="", encoding="utf-8") as csvfile:
    fieldnames = data[0].keys() if data else []
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)


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
    for event in event_data:
        print(f"Title: {event['name']}")
        print(f"Date: {event['date']}")
        print(f"Image URL: {event['image_url']}")
        print("-" * 50)
else:
    print("Failed to fetch the page.")


