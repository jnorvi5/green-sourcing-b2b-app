import pytest
import requests

# The target URL for the integration tests
TARGET_URL = "https://greenchainz.com"


@pytest.fixture(scope="module")
def site_response():
    """Fixture to make a single request to the site for all tests."""
    return requests.get(TARGET_URL)


def test_status_code(site_response):
    """
    Tests that the website is up and running by checking for a 200 OK status code.
    """
    assert site_response.status_code == 200


def test_latency(site_response):
    """
    Tests that the website responds within an acceptable timeframe (under 2 seconds).
    """
    assert site_response.elapsed.total_seconds() < 2.0


def test_content(site_response):
    """
    Tests that the website content contains the expected string "GreenChainz".
    """
    assert "GreenChainz" in site_response.text
