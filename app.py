import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, send_from_directory

app = Flask(__name__, static_folder='static', template_folder='templates')

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_to_plain_text(html_content):
    """
    Strips HTML tags and normalizes whitespace to produce clean plain text.
    """
    # Replace common HTML block elements and tags with space or newlines
    text = html_content
    # Replace links with their text and URL in parentheses if possible, or just strip
    # For tweet simplicity, we just strip the tags.
    text = re.sub(r'<[^>]+>', ' ', text)
    # Normalize whitespace
    text = " ".join(text.split())
    return text

def parse_release_notes():
    """
    Fetches the BigQuery Atom feed and parses it into individual release notes.
    """
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    req = urllib.request.Request(FEED_URL, headers=headers)
    
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'ns': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall('ns:entry', ns)
    parsed_notes = []
    
    for entry_idx, entry in enumerate(entries):
        title_elem = entry.find('ns:title', ns)
        updated_elem = entry.find('ns:updated', ns)
        link_elem = entry.find('ns:link', ns)
        content_elem = entry.find('ns:content', ns)
        
        date_str = title_elem.text.strip() if title_elem is not None else "Unknown Date"
        updated_str = updated_elem.text.strip() if updated_elem is not None else ""
        
        # Link typically has href attribute
        link_url = ""
        if link_elem is not None:
            link_url = link_elem.attrib.get('href', '')
            
        content_html = content_elem.text if content_elem is not None else ""
        
        if not content_html:
            continue
            
        # Parse the content HTML by splitting it using <h3> headings
        parts = re.split(r'(?i)<h3>(.*?)</h3>', content_html)
        
        # If there's content before the first h3, treat it as "General" or "Announcement"
        first_part = parts[0].strip()
        if first_part and len(re.sub(r'<[^>]+>', '', first_part).strip()) > 0:
            plain_text = clean_html_to_plain_text(first_part)
            parsed_notes.append({
                "id": f"note_{entry_idx}_pre",
                "date": date_str,
                "updated": updated_str,
                "type": "General",
                "html_content": first_part,
                "plain_text": plain_text,
                "link": link_url
            })
            
        # Parse the alternating type and content pairs
        for i in range(1, len(parts), 2):
            note_type = parts[i].strip()
            note_content = parts[i+1].strip() if i+1 < len(parts) else ""
            
            if not note_content and not note_type:
                continue
                
            plain_text = clean_html_to_plain_text(note_content)
            
            # Form clean unique ID
            note_id = f"note_{entry_idx}_{i}"
            
            parsed_notes.append({
                "id": note_id,
                "date": date_str,
                "updated": updated_str,
                "type": note_type if note_type else "Update",
                "html_content": note_content,
                "plain_text": plain_text,
                "link": link_url
            })
            
    return parsed_notes

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        notes = parse_release_notes()
        return jsonify({
            "status": "success",
            "count": len(notes),
            "data": notes
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Keep static files handler if needed, though Flask usually handles /static automatically.
# But template rendering will serve index.html from templates folder.

if __name__ == '__main__':
    # Ensure templates and static directories exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    app.run(host='127.0.0.1', port=5000, debug=True)
