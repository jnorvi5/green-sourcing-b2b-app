import pytest
from uuid import uuid4
from datetime import datetime, timezone
from pydantic import ValidationError

from deployment_model import DeploymentLogModel, DeploymentStatus

def test_valid_deployment_log_model():
    """Tests that a valid data dictionary successfully creates a DeploymentLogModel instance."""
    user_id = uuid4()
    log_id = uuid4()
    data = {
        "id": log_id,
        "userId": user_id,
        "deploymentId": "github-run-id-12345",
        "timestamp": datetime.now(timezone.utc),
        "status": "SUCCESS",
        "metadata": {
            "commitMessage": "Initial commit",
            "changedFiles": ["src/main.py"],
            "costConsumed": 1.23
        },
        "ttl": 2592000
    }
    model = DeploymentLogModel(**data)
    assert model.id == log_id
    assert model.userId == user_id
    assert model.status == DeploymentStatus.SUCCESS
    assert model.metadata.commitMessage == "Initial commit"
    assert model.ttl == 2592000

def test_invalid_status_raises_validation_error():
    """Tests that providing an invalid status string raises a ValidationError."""
    with pytest.raises(ValidationError):
        DeploymentLogModel(
            id=uuid4(),
            userId=uuid4(),
            deploymentId="run-id-invalid-status",
            timestamp=datetime.now(timezone.utc),
            status="PENDING",  # Invalid status
            metadata={
                "commitMessage": "Test invalid status",
                "changedFiles": ["app.py"],
                "costConsumed": 0.01
            }
        )

def test_missing_required_field_raises_validation_error():
    """Tests that missing a required field (e.g., userId) raises a ValidationError."""
    with pytest.raises(ValidationError):
        DeploymentLogModel(
            id=uuid4(),
            # userId is missing
            deploymentId="run-id-missing-field",
            timestamp=datetime.now(timezone.utc),
            status="FAILURE",
            metadata={
                "commitMessage": "Test missing field",
                "changedFiles": ["app.py"],
                "costConsumed": 0.01
            }
        )

def test_default_ttl_value():
    """Tests that the ttl field is assigned its default value if not provided."""
    data = {
        "id": uuid4(),
        "userId": uuid4(),
        "deploymentId": "run-id-default-ttl",
        "timestamp": datetime.now(timezone.utc),
        "status": "SUCCESS",
        "metadata": {
            "commitMessage": "Test default TTL",
            "changedFiles": ["app/main.py"],
            "costConsumed": 0.05
        }
        # ttl field is omitted
    }
    model = DeploymentLogModel(**data)
    assert model.ttl == 2592000
