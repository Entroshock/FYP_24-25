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


def fetch_html(url):
    """
    Fetches the HTML content of a given URL after rendering 
    it with Selenium.

    Args:
      url: The URL of the webpage to fetch.

    Returns:
      The HTML content as a string.
    """
    try:
        chromedriver_path = os.path.join(os.path.dirname(__file__), 'chromedriver-win64', 'chromedriver.exe')  
        service = Service(executable_path=chromedriver_path)
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        # Run Chrome in headless mode
        driver = webdriver.Chrome(service=service, options=options)

        driver.get(url)

        # Wait for the event cards to load 
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".mhy-contribution-card-v2"))
        )

        html = driver.page_source
        driver.quit()
        return html

    except Exception as e:
        print(f"Error fetching HTML: {e}")
        return None



def parse_event_data(html):
    """
    Parses event data from the HTML content of the Hoyolab page.

    Args:
      html: The HTML content as a string.

    Returns:
      A list of dictionaries, where each dictionary represents an event.
    """
    soup = BeautifulSoup(html, "html.parser")
    event_cards = soup.select(".mhy-contribution-card-v2")  # Select all event cards
    event_data = []
    for card in event_cards:
        title_element = card.select_one(".mhy-contribution-card-v2__title span")
        date_element = card.select_one(".mhy-contribution-card-v2__duration") 
        if title_element and date_element:
            event_data.append({
                "name": title_element.text.strip(),
                "date": date_element.text.strip(), 
            })
    return event_data

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



# Example usage
url = "https://www.hoyolab.com/circles/6/39/official?page_type=39&page_sort=events"  # Replace with the actual URL
html = fetch_html(url)
if html:
  event_data = parse_event_data(html)
  store_data_csv(event_data)
  print("Event data scraped and stored in events.csv")