import requests
from bs4 import BeautifulSoup
import time
import re

# List of all team URLs
team_urls = [
    "https://www.eliteprospects.com/team/2759/sc-csikszereda",
    "https://www.eliteprospects.com/team/19101/budapest-jegkorong-akademia-hc",
    "https://www.eliteprospects.com/team/3004/csm-corona-brasov",
    "https://www.eliteprospects.com/team/26133/deac",
    "https://www.eliteprospects.com/team/1269/dunaujvarosi-acelbikak",
    "https://www.eliteprospects.com/team/3984/dvtk-jegesmedvek",
    "https://www.eliteprospects.com/team/3754/fehervar-hockey-academy-19",
    "https://www.eliteprospects.com/team/4121/gyergyoi-hk",
    "https://www.eliteprospects.com/team/2750/ute",
    "https://www.eliteprospects.com/team/5588/dunarea-galati",
    "https://www.eliteprospects.com/team/33670/haromszeki-agyusok",
    "https://www.eliteprospects.com/team/45695/red-hawks-bucuresti",
    "https://www.eliteprospects.com/team/26221/sapientia-u23",
    "https://www.eliteprospects.com/team/5663/sportul-studentesc",
    "https://www.eliteprospects.com/team/2915/steaua-bucuresti"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

for url in team_urls:
    try:
        print(f"Scraping: {url}")
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            print(f"Failed to fetch page: Status code {response.status_code}")
            continue

        soup = BeautifulSoup(response.content, 'html.parser')
        players = []

        # Method 1: Look for specific Elite Prospects table structure
        # Try multiple possible table selectors used by Elite Prospects
        table_selectors = [
            'table[class*="table"]',
            'table[class*="roster"]',
            'table[class*="player"]',
            'table[class*="sort"]',
            '.table',
            '.roster-table',
            'table.sticky-header'
        ]

        roster_table = None

        for selector in table_selectors:
            roster_table = soup.select_one(selector)
            if roster_table:
                print(f"Found table with selector: {selector}")
                break

        # Method 2: If no table found, look for div-based roster (some sites use divs)
        if not roster_table:
            print("No table found, trying div-based structure...")
            # Look for common div structures that might contain player data
            roster_div = soup.find('div', class_=re.compile(r'roster|players|squad'))
            if roster_div:
                print("Found div-based roster")

        # Method 3: Last resort - get all potential player rows
        if not roster_table and not roster_div:
            print("Trying to find any player rows...")
            # Look for any rows that might contain player data
            all_rows = soup.find_all('tr')
            player_rows = []

            for row in all_rows:
                row_text = row.get_text().lower()
                if any(keyword in row_text for keyword in ['#', 'jersey', 'forward', 'defense', 'goalie']):
                    # Check if this row has typical player data structure
                    tds = row.find_all('td')
                    if len(tds) >= 2:
                        # Check if second td has a link (common for player names)
                        if tds[1].find('a'):
                            player_rows.append(row)

            if player_rows:
                print(f"Found {len(player_rows)} potential player rows")
                rows = player_rows

        # Process the roster table if found
        if roster_table:
            # Find all rows in the table
            rows = roster_table.find_all('tr')
            print(f"Found {len(rows)} rows in table")

            for row in rows:
                try:
                    # Skip header rows
                    if row.find('th'):
                        continue

                    tds = row.find_all('td')
                    if len(tds) < 2:
                        continue

                    # Extract data from columns
                    # Jersey number is in the second td (index 1) with class SortTable_right__s2qUT
                    number = ""
                    for td in tds:
                        if 'SortTable_right__s2qUT' in td.get('class', []):
                            number = td.get_text(strip=True)
                            # Remove the '#' symbol if present
                            number = number.replace('#', '')
                            break

                    # If we didn't find it with the class, try the second td
                    if not number and len(tds) > 1:
                        number = tds[1].get_text(strip=True)
                        number = number.replace('#', '')

                    # Player name is usually in a link in one of the columns
                    name = ""
                    position = ""

                    for i, td in enumerate(tds):
                        td_text = td.get_text(strip=True)
                        # Look for player name (usually has a link)
                        name_link = td.find('a')
                        if name_link and not name:
                            name = name_link.get_text(strip=True)

                        # Look for position indicators
                        if (td_text in ['G', 'D', 'C', 'LW', 'RW', 'F'] or
                                any(pos in td_text.upper() for pos in
                                    ['GOALIE', 'DEFENSE', 'FORWARD', 'CENTRE', 'WINGER'])):
                            position = td_text

                    # If we didn't find position, check common position patterns
                    if not position:
                        row_text = row.get_text().upper()
                        if 'G' in row_text or 'GOALIE' in row_text:
                            position = 'G'
                        elif 'D' in row_text or 'DEFENSE' in row_text:
                            position = 'D'
                        else:
                            position = 'F'  # Default to forward

                    # Map position to category
                    if position in ['G', 'G/L', 'G/R'] or 'GOALIE' in position.upper():
                        position_category = 'goalie'
                    elif position == 'D' or 'DEFENSE' in position.upper():
                        position_category = 'defender'
                    else:
                        position_category = 'forward'

                    if name and name != "":  # Only add if we have a valid name
                        index = name.find("(")
                        cleared_name = name[:index].strip() if index != -1 else name
                        players.append(f"{number} | {cleared_name} | {position_category}")
                        print(f"  Added: {number} | {cleared_name} | {position_category}")

                except Exception as e:
                    print(f"  Error processing row: {e}")
                    continue

        # Create the filename
        team_name = url.split("/")[-1]
        filename = f"{team_name}.txt"

        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("jersey_number | player_name | position\n")
            for player in players:
                f.write(player + "\n")

        print(f"Created: {filename} with {len(players)} players\n")
        time.sleep(3)  # Be polite between requests

    except Exception as e:
        print(f"Error processing {url}: {e}\n")