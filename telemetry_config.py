import os
import logging
import atexit

from opentelemetry._logs import set_logger_provider, get_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from azure.monitor.opentelemetry.exporter import AzureMonitorLogExporter

# Singleton instances for the OpenTelemetry logging setup.
_logger_provider = None
_log_handler = None

def _setup_telemetry():
    """
    Initializes and configures the OpenTelemetry logging provider and exporter.
    This function is intended to be called only once per application lifecycle.
    It sets up a global handler that can be shared by all loggers.
    """
    global _logger_provider, _log_handler

    # Check if already initialized to ensure this runs only once.
    if _logger_provider is not None:
        return

    connection_string = os.getenv("CONNECTION_STRING")
    if not connection_string:
        # Allow the application to run without a connection string for local testing.
        # A warning will be logged to the console by the calling function.
        return

    # Create the Azure Monitor log exporter from the connection string.
    exporter = AzureMonitorLogExporter.from_connection_string(connection_string)

    # Create a logger provider. Note: Samplers are for traces, not logs.
    # Cost savings will be managed by setting the logger level to INFO.
    provider = LoggerProvider()
    set_logger_provider(provider)

    # Create a batch processor to send logs to the exporter in the background.
    processor = BatchLogRecordProcessor(exporter)
    provider.add_log_record_processor(processor)

    # Create a handler that integrates with the standard logging library.
    # This handler will be shared by all loggers created via get_logger.
    handler = LoggingHandler(level=logging.NOTSET, logger_provider=provider)

    _logger_provider = provider
    _log_handler = handler

    # Ensure that the log provider is shut down gracefully, flushing any pending logs.
    atexit.register(provider.shutdown)


def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger configured to send telemetry to Azure Application Insights.

    This function initializes the Azure Monitor OpenTelemetry exporter on its
    first call. All subsequent calls will return a logger that uses the same
    shared exporter instance, ensuring efficient resource use.

    It reads the connection string from the 'CONNECTION_STRING' environment
    variable. Cost savings are achieved by setting the logger's effective
    level to INFO, which prevents DEBUG level logs from being processed.

    Args:
        name: The name of the logger.

    Returns:
        A configured instance of logging.Logger.
    """
    # Initialize the telemetry system exactly once.
    if _logger_provider is None and _log_handler is None:
        _setup_telemetry()

    logger = logging.getLogger(name)

    # If setup failed (e.g., no connection string), return a standard logger.
    if _log_handler is None:
        if not hasattr(get_logger, "_warning_logged"):
            logging.warning(
                "CONNECTION_STRING not set. Azure Monitor logging is disabled."
            )
            # Add a flag to the function itself to prevent repeated warnings.
            get_logger._warning_logged = True
        return logger

    # Add the shared handler to the logger if it's not already there.
    if _log_handler not in logger.handlers:
        logger.addHandler(_log_handler)

    # Set the level to INFO to avoid capturing DEBUG logs. The handler's level
    # is NOTSET, so the logger's level is the effective filter.
    logger.setLevel(logging.INFO)

    # Prevent logs from being propagated to the root logger, which might have
    # other handlers and cause duplicate log entries.
    logger.propagate = False

    return logger

# Example usage:
if __name__ == "__main__":
    # To run this example, set the CONNECTION_STRING environment variable first.
    # export CONNECTION_STRING="your_connection_string_here"

    print("Attempting to configure Azure Monitor logging...")

    # Get two different logger instances. They will share the same handler/exporter.
    logger1 = get_logger("my_app.module1")
    logger2 = get_logger("my_app.module2")

    if os.getenv("CONNECTION_STRING"):
        print("Logger configured. Sending example logs to Azure Application Insights...")
        logger1.info("This is an informational message from module1.")
        logger2.warning("This is a warning message from module2.")
        logger1.error(
            "This is an error from module1.",
            extra={"custom_dimensions": {"key": "value"}}
        )

        # This debug message will be ignored because the logger level is set to INFO.
        logger2.debug("This is a debug message that should not be sent.")

        print("Example log messages sent. Check your Application Insights resource.")
        print("Logs are flushed automatically on application exit.")
    else:
        print("Skipping sending logs as CONNECTION_STRING is not set.")
        logger1.info("This is a local log message that will go to the console.")

    # The atexit.register call in _setup_telemetry() handles the shutdown.
    # Exiting the script will trigger the shutdown and flush any pending logs.
    print("Script finished.")
