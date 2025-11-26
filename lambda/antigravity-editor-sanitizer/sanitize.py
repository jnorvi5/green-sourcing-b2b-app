import bleach
from bs4 import BeautifulSoup
from bleach.linkifier import Linker
from bleach.css_sanitizer import CSSSanitizer

# Define the allowlists for tags, attributes, and CSS properties based on our discussion.
ALLOWED_TAGS = [
    'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'br',
    'h1', 'h2', 'h3', 'blockquote', 'pre', 'code'
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    '*': ['style']
}

ALLOWED_CSS_PROPERTIES = [
    'color', 'background-color', 'font-weight', 'font-style', 'text-decoration'
]

def sanitize_and_format_html(raw_html: str) -> str:
    """
    Sanitizes and formats an HTML string from the Antigravity Editor.

    Args:
        raw_html: The raw HTML string to process.

    Returns:
        A sanitized and pretty-formatted HTML string.
    """
    # Step 1: Sanitize the HTML using bleach with the defined allowlists.
    # Define a filter that adds rel="noopener noreferrer" to <a> tags.
    class NoopenerNoreferrerFilter:
        def __init__(self, source):
            self.source = source

        def __iter__(self):
            for token in self.source:
                if token['type'] == 'StartTag' and token['name'] == 'a':
                    token['data'][(None, 'rel')] = 'noopener noreferrer'
                yield token

    css_sanitizer = CSSSanitizer(allowed_css_properties=ALLOWED_CSS_PROPERTIES)

    cleaner = bleach.Cleaner(
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        css_sanitizer=css_sanitizer,
        strip=True,
        filters=[NoopenerNoreferrerFilter]
    )

    sanitized_html = cleaner.clean(raw_html)

    # Step 2: Format the sanitized HTML using BeautifulSoup for consistent indentation.
    soup = BeautifulSoup(sanitized_html, 'html.parser')
    formatted_html = soup.prettify()

    return formatted_html
