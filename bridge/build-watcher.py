#!/usr/bin/env python3
"""
Build Watcher — monitors source dirs and auto-builds on file changes.
Debounces rapid edits (waits 5s after last change before triggering).
Means dev bot only needs to edit files — no build step required.
"""
import time
import logging
import subprocess
import threading
import sys
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [build-watcher] %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("build-watcher")

DEBOUNCE_SECONDS = 5

WATCH_TARGETS = [
    {
        "name": "clutch",
        "paths": [
            "/root/clutch/frontend/src",
            "/root/clutch/backend/src",
        ],
        "extensions": {".ts", ".tsx", ".css"},
        "build_cmd": (
            "cd /root/clutch/frontend && npm run build 2>&1 && "
            "cd /root/clutch/backend && npm run build 2>&1 && "
            "systemctl restart clutch"
        ),
        "verify_cmd": "systemctl is-active clutch",
    },
    {
        "name": "mission-control",
        "paths": [
            "/root/mission-control-new/src",
        ],
        "extensions": {".ts", ".tsx", ".css"},
        "build_cmd": (
            "cd /root/mission-control-new && npm run build 2>&1 && "
            "pm2 restart mission-control"
        ),
        "verify_cmd": "pm2 list | grep -q 'mission-control.*online' && echo active",
    },
]

# Per-target debounce timers
_timers: dict[str, threading.Timer] = {}
_lock = threading.Lock()


def run_build(target: dict):
    name = target["name"]
    log.info(f"[{name}] Building...")
    result = subprocess.run(
        target["build_cmd"], shell=True, capture_output=True, text=True, timeout=300
    )
    if result.returncode == 0:
        log.info(f"[{name}] Build SUCCESS")
        # verify
        v = subprocess.run(target["verify_cmd"], shell=True, capture_output=True, text=True)
        log.info(f"[{name}] Verify: {v.stdout.strip() or 'ok'}")
    else:
        log.error(f"[{name}] Build FAILED (exit {result.returncode})")
        log.error(result.stdout[-1000:] if result.stdout else "")
        log.error(result.stderr[-500:] if result.stderr else "")


def schedule_build(target: dict):
    name = target["name"]
    with _lock:
        if name in _timers:
            _timers[name].cancel()
        t = threading.Timer(DEBOUNCE_SECONDS, run_build, args=[target])
        _timers[name] = t
        t.start()
    log.info(f"[{name}] Change detected — build in {DEBOUNCE_SECONDS}s (debouncing)")


class SourceHandler(FileSystemEventHandler):
    def __init__(self, target: dict):
        self.target = target
        self.extensions = target["extensions"]

    def on_modified(self, event):
        if not event.is_directory and Path(event.src_path).suffix in self.extensions:
            log.info(f"[{self.target['name']}] Modified: {event.src_path}")
            schedule_build(self.target)

    def on_created(self, event):
        if not event.is_directory and Path(event.src_path).suffix in self.extensions:
            log.info(f"[{self.target['name']}] Created: {event.src_path}")
            schedule_build(self.target)

    def on_deleted(self, event):
        if not event.is_directory and Path(event.src_path).suffix in self.extensions:
            log.info(f"[{self.target['name']}] Deleted: {event.src_path}")
            schedule_build(self.target)


def main():
    observer = Observer()
    for target in WATCH_TARGETS:
        handler = SourceHandler(target)
        for path in target["paths"]:
            p = Path(path)
            if p.exists():
                observer.schedule(handler, str(p), recursive=True)
                log.info(f"Watching [{target['name']}] {path}")
            else:
                log.warning(f"Path not found, skipping: {path}")

    observer.start()
    log.info("Build watcher running — auto-builds on source changes")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
