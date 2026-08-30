import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

print("Initializing Chrome Webdriver...")
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--window-size=1920,1080")
# Enable browser logging
chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

try:
    print("Navigating to http://localhost:3000 ...")
    driver.get("http://localhost:3000")
    time.sleep(3)

    print("Clicking Auto-Fill Demo Files button...")
    # Find button containing text "Auto-Fill Demo Files"
    autofill_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Auto-Fill')]")
    autofill_btn.click()
    time.sleep(1)

    print("Uploading student_answers.pdf to Student Answer Sheet slot...")
    # Find file input on slot 2. The second input of type file
    inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
    pdf_path = os.path.abspath("student_answers.pdf")
    # Upload to the second slot
    inputs[1].send_keys(pdf_path)
    time.sleep(2)

    # Let's check if the filename shows correctly on screen
    print("Verifying uploaded file name on page...")
    uploaded_text = driver.find_element(By.XPATH, "//*[contains(text(), 'student_answers.pdf')]")
    print(f"Found file text on page: {uploaded_text.text}")

    print("Clicking Analyze Assessment button...")
    analyze_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Analyze Assessment')]")
    analyze_btn.click()

    print("Waiting 22 seconds for simulated analysis loop...")
    time.sleep(22)

    # Screenshot results dashboard
    screenshot_path = os.path.abspath("rendered_pdf_dashboard.png")
    driver.save_screenshot(screenshot_path)
    print(f"Results dashboard screenshot saved to: {screenshot_path}")

    # Read the diagnostic panel text
    print("Reading visualizer diagnostics panel:")
    debug_box = driver.find_element(By.XPATH, "//*[contains(text(), 'Student file:')]")
    print(debug_box.text)

    # Check for canvas elements in DOM
    canvases = driver.find_elements(By.TAG_NAME, "canvas")
    print(f"Number of canvas elements found on page: {len(canvases)}")

    # Print browser console logs
    print("Dumping Browser Console Logs:")
    logs = driver.get_log('browser')
    for log in logs:
        print(f"[{log['level']}] {log['message']}")

finally:
    driver.quit()
    print("Chrome Webdriver shut down.")
