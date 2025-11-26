import os
import subprocess
import json
import sys

# --- PREREQUISITES ---
# 1. This script requires 'pip-audit' to be installed in the environment.
#    Install it using: pip install pip-audit
# 2. For Node.js projects, 'npm install' must be run before this script
#    to ensure an up-to-date 'package-lock.json' exists.
# 3. This script must be run from the root of the repository.

def run_pip_audit():
    """
    Runs pip-audit and returns a list of vulnerabilities.
    Handles different exit codes from the pip-audit command.
    """
    if not os.path.exists('requirements.txt'):
        print("INFO: requirements.txt not found. Skipping pip-audit.")
        return []

    print("INFO: Running pip-audit...")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip_audit', '--format=json'],
            capture_output=True,
            text=True,
            check=False  # Do not raise exception on non-zero exit code
        )

        # pip-audit exit codes:
        # 0: No vulnerabilities found.
        # 1: Vulnerabilities found.
        # >1: An error occurred.

        if result.returncode == 0:
            return [] # No vulnerabilities

        # If exit code is > 0, there could be vulnerabilities or an error.
        # We try to parse JSON. If it works, vulnerabilities were found.
        try:
            data = json.loads(result.stdout)
            return data.get('vulnerabilities', [])
        except json.JSONDecodeError:
            # If JSON parsing fails, it was likely a genuine error.
            print(f"ERROR: pip-audit exited with code {result.returncode} but did not produce valid JSON.")
            print(f"  STDERR: {result.stderr.strip()}")
            return [] # Treat as no findings, but log the error.

    except FileNotFoundError:
        print("ERROR: 'python' or 'pip-audit' command not found. Is Python installed and in PATH?")
        return []
    except Exception as e:
        print(f"An unexpected error occurred during pip-audit: {e}")
        return []

def run_npm_audit():
    """
    Runs npm audit and returns a dictionary of vulnerabilities.
    Checks for package-lock.json as it's required by npm audit.
    """
    if not os.path.exists('package-lock.json'):
        print("INFO: package-lock.json not found. Skipping npm audit.")
        print("      (Have you run 'npm install'?)")
        return {}

    print("INFO: Running npm audit...")
    try:
        # npm audit exit codes:
        # 0: No vulnerabilities found.
        # >0: Vulnerabilities found or an error occurred.
        result = subprocess.run(
            ['npm', 'audit', '--json'],
            capture_output=True,
            text=True,
            check=False
        )
        # npm audit can exit with a non-zero code and still produce valid JSON
        # if vulnerabilities are found. We should always try to parse the output.
        data = json.loads(result.stdout)
        return data.get('vulnerabilities', {})
    except FileNotFoundError:
        print("ERROR: 'npm' command not found. Make sure Node.js is installed.")
        return {}
    except json.JSONDecodeError:
        # This can happen if no vulns are found or if there's a different error.
        print(f"INFO: Could not parse JSON from npm audit. This is expected if no vulnerabilities are found.")
        if result.stderr:
            print(f"  STDERR: {result.stderr.strip()}")
        return {}
    except Exception as e:
        print(f"An unexpected error occurred during npm audit: {e}")
        return {}


def analyze_vulnerabilities():
    """Analyzes vulnerabilities and exits with the appropriate status code."""
    critical_or_high_found = False

    # --- Python Scan ---
    pip_vulnerabilities = run_pip_audit()
    if pip_vulnerabilities:
        print("\n--- Python Vulnerabilities (pip-audit) ---")
        # Per directive, treat all found vulnerabilities as HIGH severity.
        print("WARNING: pip-audit does not provide granular severity. Treating all findings as HIGH.")
        critical_or_high_found = True
        for vuln in pip_vulnerabilities:
            print(f"[HIGH] Package: {vuln.get('name', 'N/A')} ({vuln.get('version', 'N/A')})")
            print(f"  Description: {vuln.get('description', 'N/A')}")
            print(f"  ID: {vuln.get('id', 'N/A')}")

    # --- Node.js Scan ---
    npm_vulnerabilities = run_npm_audit()
    if npm_vulnerabilities:
        print("\n--- Node.js Vulnerabilities (npm audit) ---")
        for name, details in npm_vulnerabilities.items():
            severity = details.get('severity', 'unknown').upper()
            title = details.get('via', [{}])[0].get('title', 'N/A') if isinstance(details.get('via'), list) and details.get('via') else 'N/A'

            print(f"[{severity}] Package: {name}")
            print(f"  Title: {title}")

            if severity in ['CRITICAL', 'HIGH']:
                critical_or_high_found = True
            elif severity in ['MODERATE', 'LOW']:
                print("  Action: Logging and proceeding as per protocol.")

    # --- Final Decision ---
    print("\n--- Security Gate: V1 ---")
    if critical_or_high_found:
        print("HALT: Critical or high severity vulnerabilities detected.")
        print("Exiting with status code 1.")
        sys.exit(1)
    else:
        print("PROCEED: No critical or high severity vulnerabilities detected.")
        print("Exiting with status code 0.")
        sys.exit(0)


if __name__ == "__main__":
    analyze_vulnerabilities()
