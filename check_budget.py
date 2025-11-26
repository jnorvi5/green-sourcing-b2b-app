import os
import sys
from azure.identity import DefaultAzureCredential
from azure.mgmt.costmanagement import CostManagementClient

def check_budget():
    """
    Checks the current Azure cost against a $100 limit.
    Exits with 1 if the cost exceeds 90% of the limit, otherwise exits with 0.
    """
    try:
        # In a real CI/CD environment, the subscription ID would be securely
        # available as an environment variable. For this script, we'll
        # fall back to a placeholder if it's not set.
        subscription_id = os.environ.get("AZURE_SUBSCRIPTION_ID")
        if not subscription_id:
            print("Error: AZURE_SUBSCRIPTION_ID environment variable not set.", file=sys.stderr)
            print("This script requires an active Azure subscription context.", file=sys.stderr)
            sys.exit(1)

        credential = DefaultAzureCredential()
        client = CostManagementClient(credential)

        scope = f"/subscriptions/{subscription_id}"
        query_payload = {
            "type": "ActualCost",
            "timeframe": "MonthToDate",
            "dataset": {
                "granularity": "None",
                "aggregation": {
                    "totalCost": {
                        "name": "PreTaxCost",
                        "function": "Sum"
                    }
                }
            }
        }

        result = client.query.usage(scope, query_payload)

        if not result.rows:
            print("Could not retrieve cost data. Assuming budget is safe for now.", file=sys.stderr)
            # Exit 0 to avoid blocking pipeline on transient API issues.
            # A more robust solution might have retries or alerts here.
            sys.exit(0)

        current_cost = result.rows[0][0]
        budget_limit = 100.00
        threshold = 0.90 * budget_limit

        print(f"Current MTD cost: ${current_cost:.2f}")
        print(f"Budget limit: ${budget_limit:.2f}")
        print(f"Alert threshold (90%): ${threshold:.2f}")

        if current_cost > threshold:
            print("\n!!! CRITICAL ALERT: BUDGET THRESHOLD REACHED !!!", file=sys.stderr)
            print("Operation Aborted.")
            sys.exit(1)
        else:
            print("\nBudget Safe.")
            sys.exit(0)

    except ImportError:
        print("Error: Azure SDK for Python is not installed.", file=sys.stderr)
        print("Please run 'pip install azure-identity azure-mgmt-costmanagement'", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        # This will catch authentication errors from DefaultAzureCredential if not logged in
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        print("Please ensure you are logged in with 'az login' and have the correct permissions.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    check_budget()
