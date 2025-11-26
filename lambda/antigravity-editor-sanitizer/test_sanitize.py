import unittest
from .sanitize import sanitize_and_format_html

class TestSanitizeAndFormatHtml(unittest.TestCase):

    def test_removes_malicious_script_tags(self):
        """Ensure <script> tags are removed."""
        raw_html = '<p>This is safe.</p><script>alert("XSS");</script>'
        expected_html = "<p>\n This is safe.\n</p>"
        sanitized = sanitize_and_format_html(raw_html)
        self.assertIn(expected_html, sanitized)
        self.assertNotIn('<script>', sanitized)

    def test_removes_malicious_onclick_attributes(self):
        """Ensure onclick attributes are removed."""
        raw_html = '<a href="#" onclick="alert(\'XSS\')">Click me</a>'
        expected_html = '<a href="#" rel="noopener noreferrer">\n Click me\n</a>'
        sanitized = sanitize_and_format_html(raw_html)
        self.assertIn(expected_html, sanitized)
        self.assertNotIn('onclick', sanitized)

    def test_preserves_allowed_tags_and_attributes(self):
        """Ensure allowed tags and styles are preserved."""
        raw_html = '<p style="color: red;"><strong>Important!</strong></p>'
        sanitized = sanitize_and_format_html(raw_html)
        self.assertIn('<p style="color: red;">', sanitized)
        self.assertIn('<strong>', sanitized)

    def test_enforces_link_security(self):
        """Ensure links have rel='noopener noreferrer'."""
        raw_html = '<a href="https://example.com" title="Example">Link</a>'
        sanitized = sanitize_and_format_html(raw_html)
        self.assertIn('rel="noopener noreferrer"', sanitized)

    def test_handles_user_provided_example(self):
        """Test the specific example from the user prompt."""
        raw_html = '<h1>Welcome</h1><p>Here is a <a href="http://example.com">link</a> and some <strong>bold</strong> text.</p><script>doEvil();</script>'
        sanitized = sanitize_and_format_html(raw_html)
        self.assertIn('<h1>', sanitized)
        self.assertIn('<a href="http://example.com" rel="noopener noreferrer">', sanitized)
        self.assertIn('<strong>', sanitized)
        self.assertNotIn('<script>', sanitized)

    def test_prettifies_html_output(self):
        """Ensure the output is properly indented."""
        raw_html = '<ul><li>One</li><li>Two</li></ul>'
        expected_indentation = " <li>\n  One\n </li>\n <li>\n  Two\n </li>"
        sanitized = sanitize_and_format_html(raw_html)
        self.assertIn(expected_indentation, sanitized)

if __name__ == '__main__':
    unittest.main()
