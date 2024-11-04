import requests
import csv
from bs4 import BeautifulSoup


def fetch_html(url):
  """
  Fetches the HTML content of a given URL.

  Args:
    url: The URL of the webpage to fetch.

  Returns:
    The HTML content as a string.
  """
  try:
    response = requests.get(url)
    response.raise_for_status()  # Raise an exception for bad status codes
    return response.text
  except requests.exceptions.RequestException as e:
    print(f"Error fetching HTML: {e}")
    return None


def parse_event_data(html):
  """
  Parses event data from the HTML content of a webpage.

  Args:
    html: The HTML content as a string.

  Returns:
    A list of dictionaries, where each dictionary represents an event.
  """
  soup = BeautifulSoup(html, "html.parser")
  # This is a placeholder. You'll need to inspect the website
  # and replace these with the actual CSS selectors for the events.
  events = soup.select(".event-item")  
  event_data = []
  for event in events:
    event_data.append({
        "name": event.select_one(".event-name").text.strip(),
        "date": event.select_one(".event-date").text.strip(),
        # Add more fields as needed
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



# Example usage
url = "https://hsr.hoyoverse.com/en-us/news"  # Replace with the actual URL
html = fetch_html(url)
if html:
  event_data = parse_event_data(html)
  store_data_csv(event_data)
  print("Event data scraped and stored in events.csv")