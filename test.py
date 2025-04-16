from selenium import webdriver
from selenium.webdriver.chrome.service import Service
import os

chromedriver_path = os.path.join(os.path.dirname(__file__), 'chromedriver-win64', 'chromedriver.exe')
service = Service(chromedriver_path)
options = webdriver.ChromeOptions()
options.add_argument('--headless')
driver = webdriver.Chrome(service=service, options=options)
driver.get("https://www.google.com")
print(driver.title)
driver.quit()
