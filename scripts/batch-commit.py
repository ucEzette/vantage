import os
import subprocess
import time
import sys

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(result.stderr)
        return None
    return result.stdout.strip()

def get_git_changes():
    status = run_command("git status --porcelain")
    if not status: return []
    files = []
    for line in status.split('\n'):
        if not line or len(line) < 3: continue
        path = line[2:].strip().strip('"')
        if "batch-commit.py" in path: continue
        files.append(path)
    return files

def generate_message(files):
    areas = []
    if any('apps/web' in f for f in files): areas.append("web")
    if any('contracts' in f for f in files): areas.append("contracts")
    if any('packages/prime-agent' in f for f in files): areas.append("agent")
    area_str = "/".join(areas) if areas else "monorepo"
    files_str = ", ".join([os.path.basename(f) for f in files if f])
    return f"Rebrand Vantage Protocol ({area_str}): {files_str}"

def batch_commit():
    print("Starting automated batch commit process...")
    # Setup
    run_command("git checkout main")
    run_command("git push -u origin main")
    
    while True:
        changes = get_git_changes()
        if not changes:
            print("No more changes to commit. Exiting.")
            break
            
        batch = changes[:3]
        message = generate_message(batch)
        print(f"\nProcessing batch: {batch}")
        
        # Stage & Commit this batch
        for f in batch:
            run_command(f"git add \"{f}\"")
        run_command(f"git commit -m \"{message}\"")
        
        # Now handle the push/pull sync
        # Since we have remaining unstaged changes, we must stash them to pull
        print("Stashing remaining changes and syncing...")
        run_command("git stash push -m 'batch-commit-temp'")
        run_command("git pull --rebase origin main")
        
        print("Pushing to remote...")
        res = run_command("git push")
        if res is None:
            print("Push failed.")
        
        print("Restoring remaining changes...")
        run_command("git stash pop")
        
        print(f"Batch completed. Waiting 3 minutes...")
        time.sleep(180)

if __name__ == "__main__":
    batch_commit()
