"""Application settings and configuration"""

import os
import re
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
    APP_VERSION = "1.4.5"

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

    _INVALID_PATH_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
    _RESERVED_WINDOWS_NAMES = {
        "CON", "PRN", "AUX", "NUL",
        *(f"COM{i}" for i in range(1, 10)),
        *(f"LPT{i}" for i in range(1, 10)),
    }

    @classmethod
    def ensure_directories(cls):
        """Create necessary directories if they don't exist"""
        cls.DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def sanitize_path_component(cls, value: str, fallback: str) -> str:
        """Return a filesystem-safe single path component.

        Windows silently normalizes some trailing spaces/dots, which can make
        parent folders appear to exist while nested paths fail with WinError 3.
        Keep this normalization centralized so analysis and download use the
        same folder names.
        """
        name = str(value or "")
        name = cls._INVALID_PATH_CHARS.sub("_", name)
        name = re.sub(r"\s+", " ", name).strip(" .")

        if not name:
            name = fallback

        stem = name.split(".", 1)[0].upper()
        if stem in cls._RESERVED_WINDOWS_NAMES:
            name = f"_{name}"

        return name

    @classmethod
    def sanitize_path_fragment(cls, value: str, fallback: str) -> Path:
        """Return a safe relative path, sanitizing each component."""
        raw = str(value or "")
        parts = [
            cls.sanitize_path_component(part, fallback)
            for part in re.split(r"[\\/]+", raw)
            if part.strip(" .")
        ]
        if not parts:
            parts = [fallback]
        return Path(*parts)

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
            safe_channel = cls.sanitize_path_component(channel_name, "Unknown Channel")
            safe_playlist = cls.sanitize_path_fragment(playlist_name, "Unknown Playlist")
            path = cls.DOWNLOADS_DIR / safe_channel / safe_playlist
        elif channel_name:
            # Channel / All Videos
            safe_channel = cls.sanitize_path_component(channel_name, "Unknown Channel")
            path = cls.DOWNLOADS_DIR / safe_channel / "All Videos"
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
