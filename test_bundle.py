import urllib.request, re
html = urllib.request.urlopen('https://account-section-management-system.vercel.app/login').read().decode('utf-8')
for js_file in re.findall(r'src="(/assets/[^"]+\.js)"', html):
    js = urllib.request.urlopen('https://account-section-management-system.vercel.app' + js_file).read().decode('utf-8')
    match = re.search(r'baseURL:([^,}]+)', js)
    if match:
        print('Found baseURL:', match.group(1))
