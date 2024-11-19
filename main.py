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
from selenium.webdriver.common.action_chains import ActionChains
import os

BASE_URL = "https://www.hoyolab.com"

def fetch_html(url):
    """
    Fetches the HTML content of a given URL after handling popups and loading stages.

    Args:
        url: The URL of the webpage to fetch.

    Returns:
        The HTML content as a string.
    """
    try:
        chromedriver_path = os.path.join(os.path.dirname(__file__), 'chromedriver-win64', 'chromedriver.exe')
        service = Service(executable_path=chromedriver_path)
        options = webdriver.ChromeOptions()
        # Comment out headless mode for debugging
        # options.add_argument('--headless')
        driver = webdriver.Chrome(service=service, options=options)

        driver.get(url)


                # Step 2: Wait for the loading spinner to disappear
        wait_for_spinner_to_disappear(driver)

                # Step 3: Handle the login popup
        close_login_popup(driver)

        # Step 1: Handle the interest selection popup
        close_interest_popup(driver)


        # Step 4: Wait for the article content to load
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".article-content"))
        )
        print("Article content detected.")

        html = driver.page_source
        driver.quit()
        return html
    except Exception as e:
        print(f"Error fetching HTML for {url}: {e}")
        driver.save_screenshot("fetch_html_debug.png")
        print("Saved fetch HTML debug screenshot.")
        return None




def parse_event_data(html):
    """
    Parses event data to extract title, date, and article link.

    Args:
        html: The HTML content as a string.

    Returns:
        A list of dictionaries containing the title, date, and link of each event.
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

        # Extract link
        link_element = card.find_parent("a")  # Find the parent <a> tag
        link = f"{BASE_URL}{link_element['href']}" if link_element and 'href' in link_element.attrs else None

        # Append event data
        event_data.append({
            "name": title,
            "date": date,
            "link": link
        })

    return event_data


def get_absolute_url(relative_url):
    if relative_url.startswith("http"):
        return relative_url
    return f"{BASE_URL}{relative_url}"



def store_data_csv(data, filename="enriched_events.csv"):
    """
    Stores event data in a CSV file.

    Args:
        data: A list of dictionaries containing enriched event data.
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




def enrich_event_data(event_data):
    """
    Enriches event data by scraping the content of each article.

    Args:
        event_data: A list of dictionaries containing event titles, dates, and links.

    Returns:
        A list of dictionaries with enriched event data, including article content.
    """
    enriched_data = []
    for event in event_data:
        print(f"Scraping article: {event['link']}")
        time.sleep(2) 
        article_content = scrape_article_content(event['link'])

        if article_content:
            # Add the article content to the event data
            event["article_content"] = article_content.get("article_content", "")
        else:
            event["article_content"] = "Failed to fetch content"

        # Remove the link if it's no longer needed
        del event["link"]

        enriched_data.append(event)
        time.sleep(random.uniform(10, 30))  # Throttle requests to avoid server overload

    return enriched_data

def scrape_article_content(url):
    time.sleep(5) 
    html = fetch_html(url)
    if not html:
        print(f"Failed to fetch article: {url}")
        return None

    soup = BeautifulSoup(html, "html.parser")

    try:
        title_element = soup.select_one(".article-title")
        title = title_element.text.strip() if title_element else "No title"

        content_element = soup.select_one(".article-content")
        content = content_element.text.strip() if content_element else "No content available"

        return {
            "url": url,
            "article_content": content
        }
    except Exception as e:
        print(f"Error parsing article {url}: {e}")
        return None



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

def close_interest_popup(driver):
    """
    Closes the interest selection popup if it appears.

    Args:
        driver: Selenium WebDriver instance.
    """
    try:
        # Wait for the interest selection popup to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(text(),'Skip')]"))
        )
        print("Interest selection popup detected.")
        skip_button = driver.find_element(By.XPATH, "//button[contains(text(),'Skip')]")
        skip_button.click()
        print("Interest selection popup closed.")
        time.sleep(2)  # Allow time for the popup to close
    except Exception as e:
        print("Interest selection popup not detected or failed to close:", e)




def close_login_popup(driver):
    """
    Closes the login popup within an iframe.

    Args:
        driver: Selenium WebDriver instance.
    """
    try:
        # Wait for the iframe to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, "hyv-account-frame"))
        )
        print("Login iframe detected.")

        # Switch to the iframe
        iframe = driver.find_element(By.ID, "hyv-account-frame")
        driver.switch_to.frame(iframe)
        print("Switched to the login iframe.")

        # Wait for the close button and click it
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "button[aria-label='close']"))
        )
        close_button = driver.find_element(By.CSS_SELECTOR, "button[aria-label='close']")
        close_button.click()
        print("Login popup closed.")

        # Switch back to the main content
        driver.switch_to.default_content()
        print("Switched back to the main content.")
        time.sleep(2)  # Allow time for the popup to close
    except Exception as e:
        print("Login popup not detected or failed to close:", e)



def wait_for_spinner_to_disappear(driver):
    """
    Waits for the loading spinner to disappear after the interest popup.

    Args:
        driver: Selenium WebDriver instance.
    """
    try:
        print("Waiting for loading spinner to appear.")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".spinner-class"))  # Replace with spinner selector
        )
        print("Loading spinner detected. Waiting for it to disappear.")
        WebDriverWait(driver, 15).until_not(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".spinner-class"))
        )
        print("Loading spinner disappeared.")
    except Exception as e:
        print("Spinner not detected or did not disappear:", e)





test_url = "https://www.hoyolab.com/article/34893777"

# Test fetching HTML
html = fetch_html(test_url)
if html:
    print("HTML fetched successfully.")
    with open("debug_article.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Saved article HTML to debug_article.html.")
else:
    print(f"Failed to fetch article: {test_url}")

# url = "https://www.hoyolab.com/circles/6/39/official?page_type=39&page_sort=notices"
# html = fetch_html(url)

# if html:
#     # Step 1: Scrape event data (titles, dates, and links)
#     event_data = parse_event_data(html)

#     # Step 2: Enrich data with article content
#     enriched_event_data = enrich_event_data(event_data)

#     # Step 3: Save enriched data to CSV
#     store_data_csv(enriched_event_data, filename="enriched_hoyolab_events.csv")
# else:
#     print("Failed to fetch the page.")


