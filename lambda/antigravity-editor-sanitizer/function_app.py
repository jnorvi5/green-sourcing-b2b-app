import azure.functions as func
import logging
from .sanitize import sanitize_and_format_html

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.route(route="sanitize")
def http_trigger(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function HTTP trigger to sanitize and format HTML content.
    """
    logging.info('Python HTTP trigger function processed a request.')

    try:
        raw_html = req.get_body().decode('utf-8')
    except (UnicodeDecodeError, AttributeError):
        return func.HttpResponse(
             "Please pass the raw HTML in the request body.",
             status_code=400
        )

    if not raw_html:
        return func.HttpResponse(
             "Request body cannot be empty.",
             status_code=400
        )

    sanitized_html = sanitize_and_format_html(raw_html)

    return func.HttpResponse(
        sanitized_html,
        mimetype="text/html",
        status_code=200
    )
