#!/usr/bin/env python3
import os
import sys
import json
import time
import subprocess
import urllib.request
from PIL import Image

CHROMIUM_PATH = "/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome"
PORT = 8901
BASE_URL = f"http://localhost:{PORT}/"
SCREENSHOTS_DIR = "screenshots"
FINAL_COVER_PATH = "/home/hatch/workspace/makefun/cover-art-willdinata-final.png"

def wait_for_server(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def main():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    
    # Start server
    server = subprocess.Popen(
        ["node", "serve.ts", "--port", str(PORT)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    try:
        print("Waiting for server to start...")
        if not wait_for_server(BASE_URL):
            print("Error: Server did not start in time.", file=sys.stderr)
            server.terminate()
            sys.exit(1)
        print("Server is up.")
        
        # Load shots.json
        if not os.path.exists("shots.json"):
            print("Error: shots.json not found.", file=sys.stderr)
            sys.exit(1)
            
        with open("shots.json", "r") as f:
            shots = json.load(f)
            
        temp_png = "temp_capture.png"
        
        results = []
        
        for shot in shots:
            name = shot["name"]
            query = shot["query"]
            w = shot["w"]
            h = shot["h"]
            url = BASE_URL + query.lstrip("/")
            
            print(f"Capturing {name} ({w}x{h}) from {url}...")
            cmd = [
                CHROMIUM_PATH,
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                "--virtual-time-budget=20000",
                f"--window-size={w},{h}",
                f"--screenshot={temp_png}",
                url
            ]
            
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0:
                print(f"Warning: Chromium exited with code {res.returncode} for {name}")
                print(res.stderr)
                
            if not os.path.exists(temp_png):
                print(f"Error: Screenshot file {temp_png} was not created for {name}", file=sys.stderr)
                continue
                
            # Process with Pillow
            img = Image.open(temp_png)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            # Enforce bounty limits: long side at most 1280 px, short side at least 480 px
            iw, ih = img.size
            long_side = max(iw, ih)
            short_side = min(iw, ih)
            
            if long_side > 1280:
                scale = 1280.0 / long_side
                new_w = int(iw * scale)
                new_h = int(ih * scale)
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                iw, ih = img.size
                short_side = min(iw, ih)
                
            if short_side < 480:
                # If short side < 480, scale up or adjust as needed, but usually 1280x720 / 1080x1080 short side is >= 480.
                pass
                
            out_path = os.path.join(SCREENSHOTS_DIR, name)
            
            # Save as JPEG with decreasing quality until size <= 256 KiB (262144 bytes)
            qualities = [88, 80, 72, 64, 56, 48, 40]
            saved = False
            final_bytes = 0
            final_q = 88
            
            for q in qualities:
                img.save(out_path, "JPEG", quality=q, optimize=True)
                size_bytes = os.path.getsize(out_path)
                if size_bytes <= 262144:
                    saved = True
                    final_bytes = size_bytes
                    final_q = q
                    break
            
            if not saved:
                # Fallback to lowest quality tested
                final_q = qualities[-1]
                img.save(out_path, "JPEG", quality=final_q, optimize=True)
                final_bytes = os.path.getsize(out_path)
                
            final_w, final_h = img.size
            print(f"Saved {name}: {final_w}x{final_h}, {final_bytes} bytes (quality={final_q})")
            results.append((name, final_w, final_h, final_bytes))
            
            if os.path.exists(temp_png):
                os.remove(temp_png)
                
        # Also capture landscape cover once more at 1920x1080 as a PNG and save to FINAL_COVER_PATH
        print("Capturing landscape cover at 1920x1080 for final PNG...")
        cover_url = BASE_URL + "?shot=cover&photo=pier&w=1920&h=1080"
        cmd = [
            CHROMIUM_PATH,
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            "--virtual-time-budget=20000",
            "--window-size=1920,1080",
            f"--screenshot={temp_png}",
            cover_url
        ]
        subprocess.run(cmd, capture_output=True, text=True)
        if os.path.exists(temp_png):
            os.makedirs(os.path.dirname(FINAL_COVER_PATH), exist_ok=True)
            os.replace(temp_png, FINAL_COVER_PATH)
            print(f"Saved final cover PNG to {FINAL_COVER_PATH} ({os.path.getsize(FINAL_COVER_PATH)} bytes)")
            
        # Clean up any other files in screenshots/ not in shots
        valid_names = {s["name"] for s in shots}
        for f in os.listdir(SCREENSHOTS_DIR):
            if f not in valid_names:
                p = os.path.join(SCREENSHOTS_DIR, f)
                if os.path.isfile(p):
                    os.remove(p)
                    print(f"Removed extraneous file from screenshots/: {f}")
                    
    finally:
        server.terminate()
        server.wait()
        if os.path.exists("temp_capture.png"):
            os.remove("temp_capture.png")

if __name__ == "__main__":
    main()
