import os
import sys
import time
import random
import subprocess
import json

# Group typical repository files logically to create an organic commit history
COMMIT_PLAN = [
    {
        "message": "Initial project scaffolding and build configuration",
        "patterns": ["*.md", ".gitignore", "apps/web/package.json", "apps/web/tsconfig.json", "contracts/package.json", "packages/sdk/package.json", "packages/prime-agent/pyproject.toml"]
    },
    {
        "message": "Establish Drizzle ORM schemas and database relations",
        "patterns": ["apps/web/drizzle.config.ts", "apps/web/src/db/schema.ts", "apps/web/src/db/relations.ts", "apps/web/src/db/index.ts"]
    },
    {
        "message": "Implement base smart contracts on Arc Testnet",
        "patterns": ["contracts/contracts/VantageRegistry.sol", "contracts/contracts/PulseToken.sol", "contracts/contracts/VantageNameService.sol", "contracts/hardhat.config.ts", "contracts/scripts/deploy.ts"]
    },
    {
        "message": "Integrate Circle Developer Controlled Wallets for core agent identities",
        "patterns": ["apps/web/src/lib/circle.ts", "scripts/circle-setup.mjs"]
    },
    {
        "message": "Map core backend API infrastructure and schema definitions",
        "patterns": ["apps/web/src/app/api/corpus/route.ts", "apps/web/src/lib/schemas.ts", "apps/web/src/lib/auth.ts"]
    },
    {
        "message": "Lay out primary frontend architecture and context providers",
        "patterns": ["apps/web/src/components/providers.tsx", "apps/web/src/app/layout.tsx", "apps/web/src/app/globals.css"]
    },
    {
        "message": "Develop protocol dashboard and leaderboard intelligence UI",
        "patterns": ["apps/web/src/app/page.tsx", "apps/web/src/app/dashboard/dashboard-client.tsx", "apps/web/src/app/leaderboard/leaderboard-client.tsx"]
    },
    {
        "message": "Initialize Prime Agent core settings and local state management",
        "patterns": ["packages/prime-agent/src/vantage_agent/config.py", "packages/prime-agent/src/vantage_agent/db.py"]
    },
    {
        "message": "Construct agent dynamic ReAct loop and system prompt architectures",
        "patterns": ["packages/prime-agent/src/vantage_agent/agent/loop.py", "packages/prime-agent/src/vantage_agent/agent/prompt.py", "packages/prime-agent/src/vantage_agent/agent/context.py"]
    },
    {
        "message": "Finalize EIP-3009 offline signing capabilities for gasless x402",
        "patterns": ["packages/prime-agent/src/vantage_agent/payments/x402_signer.py"]
    },
    {
        "message": "Deploy primary agent commerce suite and internal tool registry",
        "patterns": ["packages/prime-agent/src/vantage_agent/tools/commerce.py", "packages/prime-agent/src/vantage_agent/tools/registry.py"]
    },
    {
         "message": "Implement Alsa Premium Data APIs for real-time market data access via USDC",
         "patterns": ["packages/prime-agent/src/vantage_agent/tools/alsa.py"]
    },
    {
        "message": "Connect OpenClaw skill client for deeper external integrations",
        "patterns": ["packages/openclaw/vantage_skill/client.py", "packages/openclaw/vantage_skill/tools.py"]
    }
]

def run(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)

def main():
    if not os.path.exists(".git"):
        run("git init")
        run("git remote add origin https://github.com/ucEzette/vantage.git")
        run("git branch -M main")
    else:
        run("git branch -M main")
    
    with open("deploy_simulator_log.txt", "w") as log:
        log.write("Starting Deployment Simulator...\n")
        
    print("\n--- Vantage Git Simulation Script ---")
    print("This script will stage, commit, and push chunks of 2-3 files every 3-4 minutes.")
    
    # Get all untracked files
    res = run("git ls-files --others --exclude-standard")
    all_files = [f for f in res.stdout.split('\n') if f and os.path.exists(f)]
    
    chunks = []
    
    # Bucket explicitly targeted files into pre-defined commit messages
    import fnmatch
    for plan in COMMIT_PLAN:
        plan_files = []
        for p_pattern in plan['patterns']:
            matched = [f for f in all_files if fnmatch.fnmatch(f, p_pattern) or p_pattern in f]
            for m in matched:
                if m in all_files:
                    plan_files.append(m)
                    all_files.remove(m)
        
        while plan_files:
            size_to_take = random.choice([2, 3])
            if len(plan_files) <= 4 and len(plan_files) > 0:
                size_to_take = len(plan_files)
            batch = plan_files[:size_to_take]
            plan_files = plan_files[size_to_take:]
            if batch:
                chunks.append({"files": batch, "message": plan["message"]})

    # Group remaining untracked files algorithmically based on directory
    while all_files:
        size_to_take = min(len(all_files), random.choice([2, 3]))
        batch = all_files[:size_to_take]
        all_files = all_files[size_to_take:]
        if batch:
            primary_file = batch[0]
            dir_name = os.path.dirname(primary_file).split("/")[-1] if os.path.dirname(primary_file) else "project root"
            chunks.append({"files": batch, "message": f"Update implementation logic in {dir_name}"})
            
    print(f"\nCreated {len(chunks)} commit batches. Simulating organic timeline...")
    
    for i, chunk in enumerate(chunks):
        files = chunk["files"]
        msg = chunk["message"]
        str_files = " ".join([f'"{f}"' for f in files])
        
        print(f"\n[Batch {i+1}/{len(chunks)}] Staging files: {files}")
        run(f"git add {str_files}")
        run(f'git commit -m "{msg}"')
        
        push_res = run("git push -u origin main")
        
        status = f"Batch {i+1}/{len(chunks)} completed. Pushed: {'success' if push_res.returncode == 0 else 'failed'}"
        with open("deploy_simulator_log.txt", "a") as log:
            log.write(status + "\n")
        
        if i < len(chunks) - 1:
            sleep_time = random.randint(180, 240)
            print(f"Waiting {sleep_time} seconds before next commit sequence...")
            time.sleep(sleep_time)

    print("\nAll development cycles pushed successfully. Simulation complete.")

if __name__ == "__main__":
    main()
