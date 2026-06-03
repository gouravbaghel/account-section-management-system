import urllib.request
import re
import sys

try:
    html = urllib.request.urlopen('https://account-section-management-system.vercel.app/login').read().decode('utf-8')
    js_files = re.findall(r'src="(/assets/[^"]+\.js)"', html)
    for js_file in js_files:
        js_url = 'https://account-section-management-system.vercel.app' + js_file
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        # Look for baseURL assignment in the compiled axios code
        # Specifically, look for something that looks like a URL
        matches = re.findall(r'baseURL:"(https://[^"]+)"', js)
        if matches:
            for match in matches:
                print(f"Found baseURL string: {match}")
                sys.exit(0)
        
        matches = re.findall(r'"(https://[^"]+onrender\.com[^"]*)"', js)
        if matches:
            for match in matches:
                print(f"Found onrender URL: {match}")
                sys.exit(0)
                
    print("Could not find VITE_API_URL or onrender URL in the bundle.")
except Exception as e:
    print(f"Error: {e}")
