import os
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Define server settings
PORT = 8080
DIRECTORY = os.getcwd()

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

# Start the HTTP server
httpd = HTTPServer(("127.0.0.41", PORT), MyHandler)
print(f"Serving at port {PORT}")

# Open the default web browser to index.html
webbrowser.open(f'http://127.0.0.41:{PORT}/index.html')

# Start serving
httpd.serve_forever()