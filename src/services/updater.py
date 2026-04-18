"""
yt-dlp Auto-Updater Service

Handles automatic updates of yt-dlp on application startup.
For packaged (frozen) apps, downloads the wheel directly from PyPI
and extracts it to a local directory, bypassing pip entirely.
"""

import json
import logging
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

PYPI_URL = "https://pypi.org/pypi/yt-dlp/json"
_UPDATE_DIR_NAME = "yt_dlp_pkg"


def _get_app_data_dir() -> Path:
    if platform.system() == "Windows":
        appdata = os.environ.get("APPDATA", "")
        if not appdata or not Path(appdata).exists():
            appdata = str(Path.home())
        return Path(appdata) / "YT-Chita"
    elif platform.system() == "Darwin":
        return Path.home() / "Library" / "Application Support" / "YT-Chita"
    else:
        return Path.home() / ".local" / "share" / "YT-Chita"


def _version_tuple(version_str: str) -> tuple:
    return tuple(int(x) for x in version_str.split("."))


class YtdlpUpdater:
    """Manages yt-dlp updates"""

    def __init__(self):
        self.current_version: Optional[str] = None
        self.latest_version: Optional[str] = None

    # ── Path helpers ──────────────────────────────────────────

    def _get_update_dir(self) -> Path:
        return _get_app_data_dir() / _UPDATE_DIR_NAME

    def _get_version_file(self) -> Path:
        return self._get_update_dir() / ".version"

    def _get_installed_update_version(self) -> Optional[str]:
        vf = self._get_version_file()
        if vf.exists():
            try:
                return vf.read_text().strip()
            except Exception:
                return None
        return None

    # ── sys.path manipulation ─────────────────────────────────

    def apply_update_path(self):
        update_dir = self._get_update_dir()
        if update_dir.exists() and str(update_dir) not in sys.path:
            sys.path.insert(0, str(update_dir))
            logger.info(f"Applied yt-dlp update path: {update_dir}")

    # ── PyPI helpers ──────────────────────────────────────────

    def _get_latest_pypi_info(self) -> Optional[Tuple[str, str]]:
        try:
            req = urllib.request.Request(
                PYPI_URL,
                headers={"Accept": "application/json", "User-Agent": "YT-Chita"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())

            version = data["info"]["version"]
            for file_info in data["urls"]:
                if file_info["filename"].endswith("-py3-none-any.whl"):
                    return version, file_info["url"]

            logger.warning("No pure-Python wheel found on PyPI")
            return None
        except Exception as e:
            logger.warning(f"Failed to query PyPI: {e}")
            return None

    def _download_and_extract_wheel(self, url: str, version: str) -> bool:
        update_dir = self._get_update_dir()
        staging_dir = update_dir.parent / f"{_UPDATE_DIR_NAME}_staging"
        tmp_path = None

        try:
            with tempfile.NamedTemporaryFile(suffix=".whl", delete=False) as tmp:
                tmp_path = tmp.name

            logger.info(f"Downloading yt-dlp {version} ...")
            urllib.request.urlretrieve(url, tmp_path)

            if staging_dir.exists():
                shutil.rmtree(staging_dir)
            staging_dir.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(tmp_path, "r") as zf:
                zf.extractall(staging_dir)

            (staging_dir / ".version").write_text(version)

            if update_dir.exists():
                shutil.rmtree(update_dir)
            staging_dir.rename(update_dir)

            logger.info(f"Extracted yt-dlp {version} to {update_dir}")
            return True

        except Exception as e:
            logger.error(f"Failed to download/extract yt-dlp: {e}")
            if staging_dir.exists():
                try:
                    shutil.rmtree(staging_dir)
                except Exception:
                    pass
            return False
        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

    # ── Frozen-app update flow ────────────────────────────────

    def _check_and_update_frozen(self) -> Tuple[bool, str]:
        logger.info("=" * 50)
        logger.info("yt-dlp Auto-Update Check (packaged app)")
        logger.info("=" * 50)

        # 1. Determine current effective version (without importing yt_dlp)
        current = self._get_installed_update_version()
        if current:
            logger.info(f"Current version (local update): {current}")
        else:
            try:
                import yt_dlp.version
                current = yt_dlp.version.__version__
                logger.info(f"Current version (bundled): {current}")
            except ImportError:
                current = None
                logger.warning("yt-dlp not found in bundle")

        self.current_version = current

        # 2. Check PyPI for latest version
        pypi_info = self._get_latest_pypi_info()
        if not pypi_info:
            if current:
                self.apply_update_path()
                message = f"✅ yt-dlp {current} (update check skipped — network error)"
                logger.info(message)
                return True, message
            return False, "❌ yt-dlp not available and update check failed"

        latest_version, wheel_url = pypi_info
        self.latest_version = latest_version

        # 3. Compare versions
        if current == latest_version:
            self.apply_update_path()
            message = f"✅ yt-dlp {current} is up to date"
            logger.info(message)
            return True, message

        try:
            if current and _version_tuple(latest_version) <= _version_tuple(current):
                self.apply_update_path()
                message = f"✅ yt-dlp {current} is up to date"
                logger.info(message)
                return True, message
        except (ValueError, IndexError):
            pass

        # 4. Download and extract new version
        logger.info(f"Updating yt-dlp: {current} → {latest_version}")

        for key in list(sys.modules):
            if key.startswith("yt_dlp"):
                del sys.modules[key]

        if self._download_and_extract_wheel(wheel_url, latest_version):
            self.apply_update_path()
            self.current_version = latest_version
            message = f"✅ yt-dlp updated: {current} → {latest_version}"
            logger.info(message)
            return True, message

        # Download failed — fall back to whatever we already have
        self.apply_update_path()
        if current:
            message = f"⚠️ Update failed, using yt-dlp {current}"
            logger.warning(message)
            return True, message
        return False, "❌ yt-dlp update failed"

    def _update_frozen(self) -> Tuple[bool, str]:
        pypi_info = self._get_latest_pypi_info()
        if not pypi_info:
            return False, "❌ Failed to check PyPI for updates"

        latest_version, wheel_url = pypi_info
        self.latest_version = latest_version

        for key in list(sys.modules):
            if key.startswith("yt_dlp"):
                del sys.modules[key]

        if self._download_and_extract_wheel(wheel_url, latest_version):
            self.apply_update_path()
            self.current_version = latest_version
            message = f"✅ yt-dlp updated to {latest_version}"
            logger.info(message)
            return True, message
        return False, "❌ Failed to download yt-dlp update"

    # ── Public API ────────────────────────────────────────────

    def get_current_version(self) -> Optional[str]:
        if getattr(sys, "frozen", False):
            update_ver = self._get_installed_update_version()
            if update_ver and str(self._get_update_dir()) in sys.path:
                self.current_version = update_ver
                return update_ver
            try:
                import yt_dlp.version
                version = yt_dlp.version.__version__
                self.current_version = version
                return version
            except ImportError:
                return None

        try:
            result = subprocess.run(
                [sys.executable, "-m", "yt_dlp", "--version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                self.current_version = version
                logger.info(f"Current yt-dlp version: {version}")
                return version
            else:
                logger.warning("yt-dlp not found or error getting version")
                return None
        except subprocess.TimeoutExpired:
            logger.error("Timeout getting yt-dlp version")
            return None
        except Exception as e:
            logger.error(f"Error getting yt-dlp version: {e}")
            return None

    def update(self) -> Tuple[bool, str]:
        if getattr(sys, "frozen", False):
            return self._update_frozen()

        try:
            logger.info("Starting yt-dlp update...")
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
                capture_output=True,
                text=True,
                timeout=60,
            )

            if result.returncode == 0:
                new_version = self.get_current_version()
                if new_version:
                    self.latest_version = new_version
                    message = f"✅ yt-dlp updated successfully to {new_version}"
                    logger.info(message)
                    return True, message
                else:
                    message = "⚠️ Update completed but couldn't verify new version"
                    logger.warning(message)
                    return True, message
            else:
                error_msg = result.stderr.strip()
                message = f"❌ Update failed: {error_msg}"
                logger.error(message)
                return False, message

        except subprocess.TimeoutExpired:
            message = "❌ Update timed out (>60s)"
            logger.error(message)
            return False, message
        except Exception as e:
            message = f"❌ Update error: {str(e)}"
            logger.error(message)
            return False, message

    def check_and_update(self) -> Tuple[bool, str]:
        if getattr(sys, "frozen", False):
            return self._check_and_update_frozen()

        logger.info("=" * 50)
        logger.info("yt-dlp Auto-Update Check")
        logger.info("=" * 50)

        current = self.get_current_version()
        if not current:
            logger.warning("yt-dlp not installed, installing...")
            return self.update()

        logger.info(f"Current version: {current}")
        logger.info("Checking for updates...")
        return self.update()


# Global instance
updater = YtdlpUpdater()


def update_ytdlp_on_startup() -> Tuple[bool, str]:
    return updater.check_and_update()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("Testing yt-dlp updater...")
    success, message = update_ytdlp_on_startup()
    print(f"\nResult: {message}")
    print(f"Success: {success}")
