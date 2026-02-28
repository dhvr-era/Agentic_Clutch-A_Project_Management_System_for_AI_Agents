#!/usr/bin/env python3
"""
Clutch Bridge — Task Watcher + Approval Watcher
Direct dispatch to OpenClaw agents + Telegram fallback.
1. Task watcher: pending tasks assigned to Genie → send to Telegram
2. Approval watcher: approved approvals → dispatch directly to correct agent via Clutch API
"""
import time
import logging
import sys
import os
import urllib.request
import urllib.parse
import json
import psycopg2
import psycopg2.extras

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [bridge] %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("bridge")

DB_DSN = "dbname=agents_db user=agent_user password=clutch_secure_2026 host=localhost"
POLL_INTERVAL = 10  # seconds
GENIE_AGENT_DB_ID = 1
TELEGRAM_BOT_TOKEN = "8576030221:AAGa17qIF9LN_nrcPK8zyOufcVGY4SWhGL0"
TELEGRAM_CHAT_ID = "7715560944"
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
CLUTCH_BASE = "http://100.64.0.1:4002"
STATE_FILE = "/root/clutch/bridge/.state"

def get_mode() -> str:
    try:
        with open(STATE_FILE) as f:
            return json.load(f).get("mode", "run")
    except:
        return "run"

def get_db():
    return psycopg2.connect(DB_DSN)

def send_telegram(text):
    payload = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text
    }).encode()
    req = urllib.request.Request(
        f"{TELEGRAM_API}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result.get("ok", False)

# ── Task watcher ──────────────────────────────────────────────────────────────
def fetch_pending_tasks(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, description FROM tasks
            WHERE agent_id = %s AND status = 'pending'
            ORDER BY id ASC
        """, (GENIE_AGENT_DB_ID,))
        return cur.fetchall()

def mark_task_assigned(conn, task_id):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE tasks SET status = 'assigned', status_message = 'Dispatched to Genie'
            WHERE id = %s
        """, (task_id,))
        conn.commit()

def revert_task_pending(conn, task_id):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE tasks SET status = 'pending', status_message = 'Dispatch failed — will retry'
            WHERE id = %s
        """, (task_id,))
        conn.commit()

def dispatch_task(task_id, description):
    message = (
        f"[CLUTCH TASK #{task_id}]\n{description}\n\n"
        f"MANDATORY STEPS — follow AGENTS.md exactly:\n"
        f"1. PATCH /api/tasks/{task_id}/status → status=in_progress\n"
        f"2. Decide bot: Code/UI/API→developer | Security→security | Data→scraper | Analysis→analyst\n"
        f"3. POST delegation plan to /api/approvals — then STOP and wait for approval\n"
        f"4. On approval via Telegram: write TASK.md to bot workspace\n"
        f"5. sessions_spawn <botname>\n"
        f"6. Verify BUILD-RESULT.md shows PASS\n"
        f"7. Only then: PATCH /api/tasks/{task_id}/status → status=done\n\n"
        f"WARNING: Do NOT mark this task done until step 6 is verified. Marking done early = score 0."
    )
    try:
        ok = send_telegram(message)
        if ok:
            log.info(f"Task {task_id} dispatched to Genie via Telegram")
            return True
        else:
            log.error(f"Telegram sendMessage returned ok=false for task {task_id}")
            return False
    except Exception as e:
        log.error(f"Task {task_id} dispatch failed: {e}")
        return False

# ── Approval watcher ──────────────────────────────────────────────────────────
def fetch_pending_approvals(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT a.id, a.task_id, a.milestone, a.plan_summary,
                   t.description as task_desc, ag.openclaw_id as agent_openclaw_id
            FROM approvals a
            LEFT JOIN tasks t ON t.id = a.task_id
            LEFT JOIN agents ag ON ag.id = t.agent_id
            WHERE a.status = 'approved'
              AND (a.decided_by IS NULL OR a.decided_by != 'bridge-notified')
            ORDER BY a.decided_at ASC
        """)
        return cur.fetchall()

def mark_approval_notified(conn, approval_id):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE approvals SET decided_by = 'bridge-notified'
            WHERE id = %s
        """, (approval_id,))
        conn.commit()

def dispatch_approval(approval_id, task_id, milestone, plan_summary, task_desc, agent_openclaw_id):
    message = (
        f"[APPROVAL #{approval_id} APPROVED — PROCEED TO BUILD]\n"
        f"Task #{task_id}: {task_desc or 'N/A'}\n"
        f"Milestone: {milestone}\n\n"
        f"Approved plan:\n{plan_summary[:400] if plan_summary else 'N/A'}\n\n"
        f"Proceed to build phase immediately. Execute what was approved.\n"
        f"PATCH /api/tasks/{task_id}/status to in_progress, build, then mark done."
    )
    # Try openclaw dispatch first
    agent = agent_openclaw_id or "main"
    try:
        payload = json.dumps({"agent": agent, "message": message}).encode()
        req = urllib.request.Request(
            f"{CLUTCH_BASE}/api/openclaw/dispatch",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            if result.get("ok"):
                log.info(f"Approval {approval_id} dispatched via openclaw to agent={agent}")
                return True
            log.warning(f"Dispatch returned ok=false for approval {approval_id}: {result}")
    except Exception as e:
        log.warning(f"Openclaw dispatch failed for approval {approval_id}: {e} — falling back to Telegram")
    # Fallback: Telegram
    try:
        ok = send_telegram(message)
        if ok:
            log.info(f"Approval {approval_id} fallback-notified via Telegram")
            return True
        log.error(f"Telegram fallback also failed for approval {approval_id}")
        return False
    except Exception as e:
        log.error(f"All dispatch methods failed for approval {approval_id}: {e}")
        return False

# ── Main loop ─────────────────────────────────────────────────────────────────
def run():
    log.info("Clutch bridge started — polling every %ds (tasks + approvals)", POLL_INTERVAL)
    while True:
        try:
            mode = get_mode()
            if mode == "killed":
                log.warning("System KILLED — bridge halted. Waiting for resume.")
                time.sleep(POLL_INTERVAL)
                continue
            if mode == "paused":
                log.info("System PAUSED — skipping dispatch.")
                time.sleep(POLL_INTERVAL)
                continue
            conn = get_db()
            try:
                for task in fetch_pending_tasks(conn):
                    task_id = task["id"]
                    log.info(f"New task {task_id}: {task['description'][:80]}")
                    mark_task_assigned(conn, task_id)
                    if not dispatch_task(task_id, task["description"]):
                        revert_task_pending(conn, task_id)
                for appr in fetch_pending_approvals(conn):
                    appr_id = appr["id"]
                    log.info(f"Approval {appr_id} approved — dispatching to agent")
                    mark_approval_notified(conn, appr_id)
                    dispatch_approval(
                        appr_id, appr["task_id"], appr["milestone"],
                        appr["plan_summary"], appr["task_desc"],
                        appr.get("agent_openclaw_id")
                    )
            finally:
                conn.close()
        except Exception as e:
            log.error(f"Bridge error: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run()