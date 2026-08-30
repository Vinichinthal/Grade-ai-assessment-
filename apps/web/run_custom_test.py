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
chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

try:
    print("Navigating to http://localhost:3000 ...")
    driver.get("http://localhost:3000")
    time.sleep(3)

    print("Uploading custom_question_paper.pdf to slot 1...")
    inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
    qp_path = os.path.abspath("custom_question_paper.pdf")
    inputs[0].send_keys(qp_path)
    time.sleep(1)

    print("Uploading custom_answers.pdf to slot 2...")
    as_path = os.path.abspath("custom_answers.pdf")
    inputs[1].send_keys(as_path)
    time.sleep(1)

    print("Verifying uploaded file names on page...")
    qp_text = driver.find_element(By.XPATH, "//*[contains(text(), 'custom_question_paper.pdf')]")
    as_text = driver.find_element(By.XPATH, "//*[contains(text(), 'custom_answers.pdf')]")
    print(f"Found QP file on page: {qp_text.text}")
    print(f"Found Answer file on page: {as_text.text}")

    print("Clicking Analyze Assessment button...")
    analyze_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Analyze Assessment')]")
    analyze_btn.click()

    print("Waiting 15 seconds for simulated analysis loop...")
    time.sleep(15)

    print("Checking if Results Dashboard is loaded...")
    # Verify Biology questions are shown in the sidebar
    questions_sidebar = driver.find_element(By.XPATH, "//*[contains(text(), 'Question Sheet Map')]/ancestor::div[2]")
    print("Saving sidebar content to file...")
    with open("sidebar_output.txt", "w", encoding="utf-8") as f:
        f.write(questions_sidebar.text)
    print("Sidebar content saved to sidebar_output.txt")

    # Save dashboard screenshot
    dashboard_screenshot = os.path.abspath("rendered_biology_dashboard.png")
    driver.save_screenshot(dashboard_screenshot)
    print(f"Dashboard screenshot saved to: {dashboard_screenshot}")

    print("Clicking Full Scan button to open reference scans modal...")
    full_scan_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Full Scan')]")
    full_scan_btn.click()
    time.sleep(2)

    # Save modal screenshot
    modal_screenshot = os.path.abspath("rendered_biology_modal.png")
    driver.save_screenshot(modal_screenshot)
    print(f"Modal screenshot saved to: {modal_screenshot}")

    # Check for canvas elements in the modal
    canvases = driver.find_elements(By.TAG_NAME, "canvas")
    print(f"Number of canvases in the page including modal: {len(canvases)}")

    # Print browser console logs
    print("Dumping Browser Console Logs:")
    logs = driver.get_log('browser')
    for log in logs:
         print(f"[{log['level']}] {log['message']}")

finally:
    driver.quit()
    print("Chrome Webdriver shut down.")
