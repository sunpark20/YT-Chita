"""
Logging Configuration

Centralized logging setup for the application
"""

import logging
import sys
import platform
from pathlib import Path
from datetime import datetime


def _get_log_dir() -> Path:
    """Return platform-appropriate log directory."""
    if platform.system() == "Darwin":
        log_dir = Path.home() / "Library" / "Logs" / "YouTubeDownloader"
    elif platform.system() == "Windows":
        import os
        log_dir = Path(os.environ.get("APPDATA", Path.home())) / "YouTubeDownloader" / "Logs"
    else:
        log_dir = Path.home() / ".local" / "share" / "YouTubeDownloader" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def setup_logger(name: str = "YouTubeDownloader", level: int = logging.INFO) -> logging.Logger:
    """
    Setup and configure application logger

    Args:
        name: Logger name
        level: Logging level (default: INFO)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler (may be invisible in packaged .app, but keep for dev)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler — always write to log file so packaged app errors are visible
    try:
        log_dir = _get_log_dir()
        log_file = log_dir / f"app_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        # Print log path so users can find it
        print(f"[Logger] Log file: {log_file}", file=sys.stderr)
    except Exception as e:
        print(f"[Logger] Could not create file handler: {e}", file=sys.stderr)

    return logger


# Global logger instance
logger = setup_logger()


if __name__ == "__main__":
    # Test logger
    test_logger = setup_logger("TestLogger", logging.DEBUG)
    test_logger.debug("Debug message")
    test_logger.info("Info message")
    test_logger.warning("Warning message")
    test_logger.error("Error message")
