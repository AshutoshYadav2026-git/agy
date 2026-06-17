# BigQuery Release Insights Web Application

A premium, modern web application built using Python Flask, plain vanilla HTML, CSS, and JavaScript. It fetches the official Google Cloud BigQuery Release Notes feed, parses individual updates, and enables you to easily compose and post drafts to Twitter/X.

## Features

- **Live Synchronization**: Fetches the official XML Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) in real-time.
- **Granular Parsing**: Parses the daily grouped feed entries into individual update items (Features, Announcements, Issues, Changes, Deprecations) for clean viewing and filtering.
- **Rich Filtering & Search**: Instant client-side search by text or category pills (e.g., Features, Issues) using premium interactive animations.
- **Glassmorphic Developer UI**: A premium dark-mode dashboard themed specifically for Cloud/BigQuery developers.
- **Smart Tweet Composer**: 
  - Selects any update card to draft a tweet preview automatically.
  - Automatically calculates Twitter's strict character count (incorporating Twitter's 23-character link shortening rules).
  - Enables manual edits to the draft text.
  - Features quick "Copy Draft" and "Tweet Now" (via Twitter Web Intent) buttons.

## Project Structure

```text
agy-cli-projects/
├── app.py                  # Flask Web Server & API (Feed Parser)
├── requirements.txt        # Application Dependencies
├── run.bat                 # Windows Launcher script (One-click)
├── templates/
│   └── index.html          # HTML5 Layout structure
└── static/
    ├── style.css           # Premium Glassmorphism & Animations
    └── app.js              # State manager & Tweet handler
```

## Running the Application

### 1. Simple Launcher (Windows)
Double-click the `run.bat` file in this directory. It will:
- Set up the environment.
- Install any missing dependencies in a local virtual environment (`venv`).
- Open your default browser to `http://127.0.0.1:5000/`.
- Launch the Flask server.

### 2. Manual Command Line
If you prefer to run it manually from your terminal, run the following:

```bash
# Navigate to the project folder
cd C:\Users\ASUS\agy-cli-projects

# Create a virtual environment (if not already created)
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run the Flask app
python app.py
```

Open your browser and navigate to `http://127.0.0.1:5000/`.
