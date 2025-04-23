# Kephale: Honkai Star Rail Events Calendar
A comprehensive web application that scrapes, processes, and displays upcoming events for Honkai Star Rail players. This final year project for TUD Computer Science International program combines web scraping, data processing, and interactive visualization to create a useful tool for the gaming community.
 ## 🌟 Features

- Automated scraping of official Honkai Star Rail announcements
- Intelligent parsing of event dates and details
- Sentiment analysis of community reactions to events
- Interactive calendar interface with filtering capabilities
- Responsive design that works on mobile and desktop devices
- Dark space-themed UI that matches the game's aesthetic

## 🛠️  Tech Stack

- Frontend: Angular with FullCalendar integration
- Backend: Python scraper running on GitHub Actions
- Database: Firebase Firestore
- NLP: Hugging Face Transformers for sentiment analysis
- Hosting: Firebase Hosting

## 📋  Prerequisites

Node.js (version 16+)
Angular CLI (matching version in package.json)
Python 3.10+ (for running the scraper)
Firebase CLI (optional, for deployment)

## 🚀 Installation

Clone the repository:
```
git clone https://github.com/yourusername/kephale.git
cd kephale
```
Install dependencies:
```
npm install
```
Run the application locally:
```
ng serve
```
View the application at http://localhost:4200

Note: The application is preconfigured to use existing data from the included JSON files. The Firebase service key has been included for convenience during evaluation but would normally be secured in a production environment.

## 🔄 Running the Scraper (Optional)
If you want to update the event data:

Install Python requirements:
```
pip install requests firebase-admin transformers torch
```
Run the scraper:
python main.py

Note: The scraper includes deliberate delays to prevent API rate limiting. A full scrape may take several minutes to complete.

## Hosted Version
- There's a hosted version at this link if you do not want to run the commands above.
- https://project-ba-eff57.firebaseapp.com/

## 📂  Project Structure

- /src - Angular application source
- /src/app - Application components
- /src/assets - Static assets including images
- main.py - Python scraper script
- formatted_events.json - Pre-scraped event data

## 👏  Acknowledgments

HoYoLab for providing the community platform
FullCalendar for the calendar visualization framework
Hugging Face for NLP tools and models

## 📄 License
This project is submitted as academic work for TUD Computer Science International Final Year Project 2024-2025. All rights reserved.
