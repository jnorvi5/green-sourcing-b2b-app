from enum import Enum
from typing import List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DeploymentStatus(str, Enum):
    """Enumeration for the deployment status."""
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"

class MetadataModel(BaseModel):
    """Pydantic model for the deployment metadata."""
    commitMessage: str = Field(..., description="The commit message from the deployment.")
    changedFiles: List[str] = Field(..., description="A list of files changed in the deployment.")
    costConsumed: float = Field(..., description="The cost consumed by the deployment in RUs.")

class DeploymentLogModel(BaseModel):
    """
    Pydantic model for a deployment log entry, designed for Azure Cosmos DB.
    This model enforces the schema for tracking deployment versions.
    """
    id: UUID = Field(..., description="The unique identifier for the log record (UUID).")
    userId: UUID = Field(..., description="The UUID of the Antigravity Editor user who initiated the deployment.")
    deploymentId: str = Field(..., description="The unique identifier for the deployment, e.g., from a CI/CD system like a GitHub run ID.")
    timestamp: datetime = Field(..., description="The ISO 8601 UTC timestamp of when the deployment occurred.")
    status: DeploymentStatus = Field(..., description="The final status of the deployment, either SUCCESS or FAILURE.")
    metadata: MetadataModel = Field(..., description="A nested object containing additional details about the deployment.")
    ttl: int = Field(default=2592000, description="Time to Live for the document, in seconds (defaults to 30 days).")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
                "userId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
                "deploymentId": "github-run-id-12345",
                "timestamp": "2025-11-26T12:00:00Z",
                "status": "SUCCESS",
                "metadata": {
                    "commitMessage": "Fixed header",
                    "changedFiles": ["index.html", "style.css"],
                    "costConsumed": 0.02,
                },
                "ttl": 2592000,
            }
        },
    )
