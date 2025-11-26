
import os
import sys
import subprocess
import time
import requests
import json
from opencensus.ext.azure.log_exporter import AzureLogHandler

import logging

# =================================================================================================
# CONFIGURATION
# =================================================================================================

# --- Azure Configuration ---
# Pulled from environment variables set by the GitHub Actions workflow.
RESOURCE_GROUP = os.environ.get("AZURE_RESOURCE_GROUP")
APP_NAME = os.environ.get("AZURE_APP_NAME", "greenchainz-backend")
ACR_NAME = os.environ.get("AZURE_ACR_NAME")

# --- New Image Details ---
# The new tag is expected to be in the format 'build-{GITHUB_RUN_ID}'.
NEW_IMAGE_TAG = os.environ.get("NEW_IMAGE_TAG")
if not NEW_IMAGE_TAG:
    print("FATAL: NEW_IMAGE_TAG environment variable not set.")
    sys.exit(1)

NEW_DOCKER_IMAGE = f"{ACR_NAME}.azurecr.io/{APP_NAME}:{NEW_IMAGE_TAG}"

# --- Health Check Configuration ---
HEALTH_CHECK_URL = os.environ.get("HEALTH_CHECK_URL") # e.g., "https://greenchainz-backend.azurewebsites.net/api/health"
DEPLOYMENT_TIMEOUT_SECONDS = 180
HEALTH_CHECK_INTERVAL_SECONDS = 15

# --- Logging Configuration ---
# The Application Insights Instrumentation Key for logging failures.
APPINSIGHTS_KEY = os.environ.get("APPINSIGHTS_INSTRUMENTATIONKEY")

# =================================================================================================
# HELPER FUNCTIONS
# =================================================================================================

def setup_logger():
    """Sets up a logger that sends critical errors to Application Insights."""
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.ERROR)

    if APPINSIGHTS_KEY:
        handler = AzureLogHandler(connection_string=f'InstrumentationKey={APPINSIGHTS_KEY}')
        logger.addHandler(handler)
    else:
        print("WARNING: APPINSIGHTS_INSTRUMENTATIONKEY not set. Errors will not be logged to Application Insights.")

    return logger

logger = setup_logger()

def run_command(command, timeout=None):
    """Executes a shell command and returns its stdout. Exits on failure."""
    try:
        print(f"Executing: {' '.join(command)}")
        result = subprocess.run(
            command, check=True, capture_output=True, text=True, timeout=timeout
        )
        return result.stdout
    except subprocess.TimeoutExpired as e:
        # This is an expected outcome for the 'az webapp log tail' command.
        # We return the output captured before the timeout.
        print("INFO: Command timed out as expected for log streaming. Analyzing captured logs.")
        return e.stdout if e.stdout else ""
    except subprocess.CalledProcessError as e:
        print(f"FATAL: Command failed with exit code {e.returncode}.")
        print(f"Stderr: {e.stderr}")
        # Log the critical failure before exiting
        properties = {'custom_dimensions': json.dumps({"command": ' '.join(command), "stderr": e.stderr})}
        logger.error(f"Azure CLI command failed: {e}", extra=properties)
        sys.exit(1)


def get_last_known_good_tag():
    """Queries Azure to get the currently deployed Docker image tag."""
    print("Querying for the Last Known Good (LKG) image tag...")
    command = [
        "az", "webapp", "config", "container", "show",
        "--name", APP_NAME,
        "--resource-group", RESOURCE_GROUP
    ]
    result_json = run_command(command)
    config = json.loads(result_json)

    # Handle edge case where no container is configured and Azure returns an empty list
    if not config:
        print("FATAL: Azure returned no container configuration for this web app.")
        sys.exit(1)

    # Extract the full image name (e.g., myacr.azurecr.io/greenchainz-backend:build-12345)
    current_image = config[0].get("image")
    if not current_image:
        print("FATAL: Could not determine the current image from Azure response.")
        sys.exit(1)

    print(f"LKG Image Found: {current_image}")
    return current_image

def deploy_new_image(image_name):
    """Deploys the new Docker image to the Azure Web App."""
    print(f"\nAttempting to deploy new image: {image_name}")
    command = [
        "az", "webapp", "config", "container", "set",
        "--name", APP_NAME,
        "--resource-group", RESOURCE_GROUP,
        "--docker-custom-image-name", image_name
    ]
    run_command(command)
    print("Deployment command sent. Container is restarting.")

def check_for_crash_loop():
    """Checks for container crash loop indicators by analyzing a snapshot of recent logs."""
    print("Checking for container crash loops...")
    try:
        command = [
            "az", "webapp", "log", "tail",
            "--name", APP_NAME,
            "--resource-group", RESOURCE_GROUP,
        ]
        # The 'az webapp log tail' command streams logs. We run it with a timeout
        # to capture a snapshot of recent activity without hanging the pipeline.
        logs = run_command(command, timeout=15)
        if "CrashLoopBackOff" in logs or "restarting" in logs.lower():
            # This is a simplistic check; more robust patterns might be needed.
            raise DeploymentException("CrashLoopBackOff or restarting detected in container logs.")
    except Exception as e:
        # Re-raise our custom exception, but avoid wrapping it if it's already our type
        if isinstance(e, DeploymentException):
            raise
        raise DeploymentException(f"Log analysis failed: {e}")


def perform_health_check():
    """
    Polls the health check endpoint and container logs for a specified duration.
    Raises a DeploymentException if the deployment is not healthy within the timeout.
    """
    print(f"Starting health check polling for {DEPLOYMENT_TIMEOUT_SECONDS} seconds...")
    start_time = time.time()

    while time.time() - start_time < DEPLOYMENT_TIMEOUT_SECONDS:
        # 1. Check Heartbeat Endpoint
        try:
            if HEALTH_CHECK_URL:
                print(f"Pinging {HEALTH_CHECK_URL}...")
                response = requests.get(HEALTH_CHECK_URL, timeout=10)
                if response.status_code == 200:
                    print("Health check successful! Status: 200 OK.")
                    return True # Success
            else:
                print("Skipping URL health check as HEALTH_CHECK_URL is not set.")
                # If no URL, we rely only on the log check and timeout.

        except requests.RequestException as e:
            print(f"Health check endpoint not ready yet: {e}")

        # 2. Check for Crash Loops (less frequently, it's a heavier command)
        if int(time.time() - start_time) % 30 == 0: # Check every 30s
             check_for_crash_loop()

        # 3. Wait before next check
        time.sleep(HEALTH_CHECK_INTERVAL_SECONDS)

    # If the loop completes without returning, it's a timeout.
    raise DeploymentException("Deployment timed out after 180 seconds.")


def revert_to_lkg(lkg_image_name):
    """Rolls back the deployment to the Last Known Good image."""
    print("\n" + "="*80)
    print("! DEPLOYMENT FAILED. INITIATING ROLLBACK !")
    print(f"Reverting to LKG image: {lkg_image_name}")
    print("="*80)

    command = [
        "az", "webapp", "config", "container", "set",
        "--name", APP_NAME,
        "--resource-group", RESOURCE_GROUP,
        "--docker-custom-image-name", lkg_image_name
    ]
    run_command(command)
    print("Rollback command sent successfully.")


class DeploymentException(Exception):
    """Custom exception for deployment failures."""
    pass

# =================================================================================================
# MAIN EXECUTION
# =================================================================================================

def main():
    # Pre-flight checks for required environment variables
    if not all([RESOURCE_GROUP, APP_NAME, ACR_NAME]):
        print("FATAL: Missing one or more required Azure environment variables (RESOURCE_GROUP, APP_NAME, ACR_NAME).")
        sys.exit(1)

    lkg_tag = ""
    try:
        # 1. Get the current image tag (LKG)
        lkg_tag = get_last_known_good_tag()

        # 2. Try to deploy the new image tag.
        deploy_new_image(NEW_DOCKER_IMAGE)

        # 3. Wait for health check to pass.
        perform_health_check()

        print("\n" + "="*80)
        print("✅ DEPLOYMENT SUCCEEDED")
        print("="*80)
        sys.exit(0)

    except (DeploymentException, Exception) as e:
        error_message = f"An exception occurred during deployment: {e}"
        print(error_message)

        # Log to Application Insights using .exception() to include stack trace
        properties = {'custom_dimensions': json.dumps({"lkg_tag": lkg_tag, "failed_tag": NEW_DOCKER_IMAGE})}
        logger.exception(error_message, extra=properties)

        # 4. If any step fails, revert to the LKG tag.
        if not lkg_tag:
            print("FATAL: Could not perform rollback because the LKG tag was not retrieved.")
            print("Manual intervention required!")
        else:
            revert_to_lkg(lkg_tag)

        # 5. Send alert to AGENT KING
        print("\nALERT: AGENT KING - Deployment Failed and Rolled Back.")

        sys.exit(1)

if __name__ == "__main__":
    main()
