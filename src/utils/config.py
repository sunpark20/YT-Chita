"""
Configuration Management

Application settings and configuration
"""

import os
import sys
from pathlib import Path
from typing import Optional


def get_base_path():
    """
    Get base path for application resources

    Works both in development and PyInstaller builds
    """
    if getattr(sys, 'frozen', False):
        # Running in PyInstaller bundle
        return Path(sys._MEIPASS)
    else:
        # Running in development
        return Path(__file__).parent.parent.parent


class Config:
    """Application configuration"""

    # Application
    APP_NAME = "ytninza"
    APP_VERSION = "1.4.0"

    # Server
    HOST = "127.0.0.1"
    PORT = 8000

    # YouTube API
    YOUTUBE_API_KEY: Optional[str] = os.getenv("YOUTUBE_API_KEY", None)

    # Paths
    BASE_DIR = get_base_path()
    FRONTEND_DIR = BASE_DIR / "src" / "frontend"
    DEFAULT_DOWNLOADS_DIR = Path.home() / "Downloads" / "ytninza"
    DOWNLOADS_DIR = DEFAULT_DOWNLOADS_DIR

    # Download settings
    DEFAULT_QUALITY = "720p"
    MAX_VIDEOS_PER_REQUEST = 5000

    # Performance
    CHUNK_SIZE = 8192  # For file operations

    @classmethod
    def ensure_directories(cls):
        """Create necessary directories if they don't exist"""
        cls.DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def get_download_path(cls, channel_name: str = "", playlist_name: str = "") -> Path:
        """
        Get download path for videos

        Args:
            channel_name: YouTube channel name
            playlist_name: Playlist name (optional)

        Returns:
            Path object for download directory
        """
        if channel_name and playlist_name:
            # Channel / Playlist structure
            path = cls.DOWNLOADS_DIR / channel_name / playlist_name
        elif channel_name:
            # Channel / All Videos
            path = cls.DOWNLOADS_DIR / channel_name / "All Videos"
        else:
            # Root downloads folder
            path = cls.DOWNLOADS_DIR

        path.mkdir(parents=True, exist_ok=True)
        return path


    @classmethod
    def set_downloads_dir(cls, path: str):
        cls.DOWNLOADS_DIR = Path(path)
        cls.ensure_directories()

    @classmethod
    def reset_downloads_dir(cls):
        cls.DOWNLOADS_DIR = cls.DEFAULT_DOWNLOADS_DIR
        cls.ensure_directories()


# Initialize directories on import
Config.ensure_directories()

# Load saved download directory
def _load_saved_downloads_dir():
    from utils.key_manager import load_download_dir
    saved = load_download_dir()
    if saved:
        p = Path(saved)
        if p.exists() or p.parent.exists():
            Config.DOWNLOADS_DIR = p
            Config.ensure_directories()

_load_saved_downloads_dir()


if __name__ == "__main__":
    print(f"App Name: {Config.APP_NAME}")
    print(f"Version: {Config.APP_VERSION}")
    print(f"Base Dir: {Config.BASE_DIR}")
    print(f"Frontend Dir: {Config.FRONTEND_DIR}")
    print(f"Downloads Dir: {Config.DOWNLOADS_DIR}")
    print(f"YouTube API Key: {'Set' if Config.YOUTUBE_API_KEY else 'Not Set'}")
