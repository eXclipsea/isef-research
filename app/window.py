"""Open ResearchOS in a native macOS window (WKWebView via pywebview).

Run by ResearchOS.app after the backend is reachable on :8000.
Closing the window returns from webview.start(), letting the launcher
shut the services down.
"""
import sys
import urllib.request

URL = "http://localhost:8000"


def backend_up() -> bool:
    try:
        with urllib.request.urlopen(f"{URL}/health", timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def main() -> int:
    try:
        import webview
    except Exception as e:
        print(f"pywebview unavailable: {e}", file=sys.stderr)
        return 2

    webview.create_window(
        "ResearchOS",
        URL,
        width=1440,
        height=920,
        min_size=(900, 600),
    )
    webview.start()  # blocks until the window is closed
    return 0


if __name__ == "__main__":
    sys.exit(main())
