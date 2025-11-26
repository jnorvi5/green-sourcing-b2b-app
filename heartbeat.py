import requests
import time
import os
from datetime import datetime, timezone

URL = "https://www.google.com/search?q=Greenchainz.com"
LOG_DIR = "./logs"
LOG_FILE = os.path.join(LOG_DIR, "heartbeat_monitor.log")

def log_status(status_code, latency, message):
    """
    Logs the status to the log file.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    log_entry = f"{timestamp} | STATUS: {status_code} | LATENCY: {latency}ms | MSG: {message}\n"
    with open(LOG_FILE, "a") as f:
        f.write(log_entry)

def main():
    """
    Main function to run the heartbeat monitor.
    """
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

    consecutive_failures = 0

    while True:
        try:
            start_time = time.time()
            response = requests.get(URL, timeout=10)
            end_time = time.time()
            latency = round((end_time - start_time) * 1000)
            status_code = response.status_code
            message = "OK" if status_code == 200 else response.reason
        except requests.exceptions.RequestException as e:
            latency = -1
            status_code = 0
            message = str(e)

        log_status(status_code, latency, message)

        if status_code == 200:
            consecutive_failures = 0
        else:
            consecutive_failures += 1

        if consecutive_failures >= 3:
            print("CRITICAL ALERT: Three consecutive failures detected.")

        time.sleep(60)

if __name__ == "__main__":
    main()
