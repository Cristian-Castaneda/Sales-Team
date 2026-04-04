# OpenClaw VPS Blueprint

This is the minimal step-by-step blueprint to get a **private OpenClaw server** running on your **Hostinger Ubuntu VPS** using **SSH from your Mac**, with:

- OpenClaw in Docker (Container 1)
- Headless Chrome in Docker (Container 2 — uses the public `ghcr.io/browserless/chromium` image, no custom Dockerfile needed)
- Private access only
- WhatsApp as the chat channel
- OpenRouter as main model
- Anthropic API and OpenAI API also configured
- GitHub access via SSH key (.pem / private key)
- **Doppler** for secrets (no `.env` file on disk — secrets injected at runtime)
- All config and Docker files versioned in the **Sales-Team** repo and pulled to the VPS during setup

---
## VPS structure
```
/ (VPS root)
|
+-- root/                                    <- Root user home
|   +-- .ssh/                                <- SSH credentials
|   |   +-- github_agent_key                     Private key for GitHub
|   |   +-- config                               Maps github.com to the key
|   |
|   +-- .openclaw/                           <- OpenClaw runtime (created by docker-setup.sh)
|       +-- openclaw.json                        Active config (copied from repo)
|       +-- skills/                              Active skills (copied from repo)
|           +-- skill-builder/
|           |   +-- SKILL.md
|           |   +-- scripts/
|           +-- linkedin-poster/
|               +-- SKILL.md
|               +-- scripts/
|
+-- opt/                                     <- Third-party software
    +-- openclaw/                             <- OpenClaw source
    |   +-- docker-setup.sh                      Run once to initialize
    |   +-- ...
    |
    +-- agents/                              <- Your project repos
    |   +-- Sales-Team/                      <- YOUR REPO (source of truth)
    |       +-- README.md                        This blueprint / setup guide
    |       +-- .gitignore                       Ignores .env, node_modules, keys
    |       +-- docker/
    |       |   +-- Dockerfile                   Extends openclaw:local + Bun
    |       |   +-- docker-compose.yml           2 containers: openclaw + browser
    |       +-- config/
    |       |   +-- openclaw.json                Models, browser, channels
    |       +-- skills/
    |       |   +-- skill-builder/               SKILL.md + scripts/
    |       |   +-- linkedin-poster/             SKILL.md + scripts/
    |       +-- Agents/
    |       |   +-- agents.json
    |       |   +-- marketing_genious.md
    |       |   +-- product_owner.md
    |       |   +-- copywriting.md
    |       |   +-- meta_publisher.md
    |       |   +-- linkedin_publisher.md
    |       |   +-- Image_builder.md
    |       |   +-- video_builder.md
            +-- workspace/
            |   +-- IDENTITY.md                  Agent name, emoji, greeting
            |   +-- SOUL.md                      Personality, tone, communication rules
            |   +-- USER.md                      Operator profile (Cristian + Expense 360 context)
            |   +-- AGENTS.md                    Mission, priorities, decision rules
            |   +-- HEARTBEAT.md                 Periodic autonomous checks
    |       +-- workflows/
    |           +-- daily_5_posts.md
    |
    +-- openclaw-deploy/                     <- Live deployment (Docker runs here)
        +-- Dockerfile                           Copied from Sales-Team/docker/
        +-- docker-compose.yml                   Copied from Sales-Team/docker/
        (no .env — secrets come from Doppler at runtime)
```

## Repo structure (Sales-Team)

The following files will live in the repo and get cloned to the VPS early in the process:

```
Sales-Team/
├── docker/
│   ├── Dockerfile                 # Extends OpenClaw image with Bun (TypeScript runtime)
│   └── docker-compose.yml         # Docker Compose for OpenClaw + headless Chrome
├── config/
│   └── openclaw.json              # OpenClaw configuration (models, browser, channels)
├── workspace/
│   ├── IDENTITY.md                # Agent identity card (name, emoji, greeting)
│   ├── SOUL.md                    # Personality, tone, red lines
│   ├── USER.md                    # Operator profile and product context
│   ├── AGENTS.md                  # Mission, priorities, decision-making rules
│   └── HEARTBEAT.md               # Periodic autonomous check instructions
├── skills/
│   └── skill-builder/             # Meta-skill that generates new OpenClaw skills
│       ├── SKILL.md               # Skill instructions (read by OpenClaw at runtime)
│       └── scripts/               # TypeScript scripts (run by Bun, no build step)
├── .gitignore                     # Must include .env (kept as safety net)
└── ...                            # Your other project files
```

> **Secrets are never stored on disk.** They live in Doppler and are injected at runtime via `doppler run -- docker compose ...`. No `.env` file is created or needed on the VPS.

---

## 1) SSH into the VPS from your Mac

```bash
ssh root@72.61.58.110
```

If you already created a non-root user:
```bash
ssh YOUR_USER@72.61.58.110
```

---

## 2) Update Ubuntu and install Docker

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg]   https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable"   > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify:
```bash
docker version
docker compose version
```

---

## 3) Create GitHub SSH key and add it to the VPS

We do this **before cloning** so the repo is available for all subsequent steps.

### 3a) Generate the key pair on your Mac

```bash
ssh-keygen -t ed25519 -C "openclaw-vps" -f ~/.ssh/openclaw_vps_key
```

This creates two files on your Mac:
- `~/.ssh/openclaw_vps_key` — the private key (goes to the VPS)
- `~/.ssh/openclaw_vps_key.pub` — the public key (goes to GitHub)

### 3b) Add the public key to GitHub using gh CLI

```bash
gh ssh-key add ~/.ssh/openclaw_vps_key.pub --title "OpenClaw VPS"
```

### 3c) Copy the private key to the VPS (from your Mac)

```bash
scp ~/.ssh/openclaw_vps_key root@72.61.58.110:/root/.ssh/github_agent_key
```

### 3d) Set up SSH on the VPS

SSH into the VPS, then:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
chmod 600 /root/.ssh/github_agent_key
```

Create SSH config:
```bash
nano ~/.ssh/config
```

Put:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/github_agent_key
  IdentitiesOnly yes
```

Test:
```bash
ssh -T git@github.com
```

> **Reusability note**: These keys are not tied to any specific VPS. If you kill the VPS and start a new one, just `scp` the same private key from your Mac to the new server and repeat step 3d. No need to regenerate or re-register with GitHub.

---

## 4) Clone the Sales-Team repo

```bash
mkdir -p /opt/agents
cd /opt/agents
git clone git@github.com:Cristian-Castaneda/Sales-Team.git
cd Sales-Team
```

From this point on, all Docker and config files come from this repo.

---
### Install the deploy script and lock the repo folder

The repo includes a deploy script that safely pulls changes and copies files to the right places. Install it as a system command:
```bash
cp /opt/agents/Sales-Team/config/deploy-pull.sh /usr/local/bin/deploy-pull
chmod +x /usr/local/bin/deploy-pull
```

Then lock the repo folder so files can only be updated through `git pull`, never by accidental `cp` into it:
```bash
chattr -R +i /opt/agents/Sales-Team
chattr -R -i /opt/agents/Sales-Team/.git
```

From now on, whenever you push changes from your Mac, on the VPS just run:
```bash
deploy-pull
```

This unlocks the repo, pulls, copies all files to their active locations, and locks it again.

### Install the build commands

After pulling the repo you also have two build commands available. Install them the same way:

```bash
cp /opt/agents/Sales-Team/config/build-openclaw.sh /usr/local/bin/build-openclaw
cp /opt/agents/Sales-Team/config/build-openclaw-skills.sh /usr/local/bin/build-openclaw-skills
chmod +x /usr/local/bin/build-openclaw
chmod +x /usr/local/bin/build-openclaw-skills
```

**`build-openclaw`** — copies the Docker files, config, and all skills to their active locations, then runs a full container rebuild and restart. Use this when you change `Dockerfile`, `docker-compose.yml`, or `openclaw.json`:
```bash
build-openclaw
```

**`build-openclaw-skills`** — copies only the skills folder, then restarts the `openclaw` container (no rebuild needed). Use this for day-to-day skill updates since skills change much more often than Docker config:
```bash
build-openclaw-skills
```

> **Tip**: After running `deploy-pull` to pull the latest commits, follow up with `build-openclaw` (for Docker/config changes) or `build-openclaw-skills` (for skills-only changes) to apply them immediately.

## 5) Clone OpenClaw

```bash
mkdir -p /opt/openclaw
cd /opt
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

OpenClaw supports Docker setup and uses the Gateway as the control plane.

---

## 6) Run the OpenClaw Docker onboarding once

```bash
cd /opt/openclaw
./docker-setup.sh
```
The setup will ask you a series of questions:

1. **"Continue?"** → Yes
2. **"Onboarding mode"** → Manual (we control everything through the repo, not auto-setup)
3. **"Workspace directory"** → Change to `/root/.openclaw/workspace` (the default `/home/node/.openclaw/workspace` is wrong when running as root)
4. **"Model/auth provider"** → OpenRouter (this sets up initial auth so the gateway works immediately)
    - It will ask for your OpenRouter API key → Paste it
    - Select model `openrouter/meta-llama/llama-3.3-70b-instruct`
5. **"Gateway bind"** → Loopback (127.0.0.1) (keeps the gateway private, access via SSH tunnel)
6. **"Gateway auth"** → Token (it will generate a token — save this as your OPENCLAW_GATEWAY_TOKEN for the .env file)
7. **"Tailscale exposure"** → Off
8. **"Configure chat channels now?"** → No, we will do it later.



After completing the setup, the base OpenClaw config is created under:
- `~/.openclaw/`

OpenClaw's config file is typically:
- `~/.openclaw/openclaw.json`

The Gateway default port is commonly `18789`.

---

## 7) Deploy the OpenClaw config from the repo

Instead of manually editing `~/.openclaw/openclaw.json`, we copy the versioned config from the repo:

```bash
cp /opt/agents/Sales-Team/config/openclaw.json ~/.openclaw/openclaw.json

```

The repo version of `config/openclaw.json` should contain the full configuration (models, browser, channels). See the reference below for what goes inside it.


> **Note on browser cdpUrl**: We use `http://browser:3000` instead of `http://127.0.0.1:3000` because inside Docker Compose, containers talk to each other by service name. The `browser` service name resolves to the headless Chrome container automatically.

OpenClaw supports model refs in `provider/model` format. OpenRouter model refs can include extra `/` segments after the provider prefix. OpenClaw supports API-key based auth for OpenRouter, Anthropic, and OpenAI.

---

## 8) Set up Doppler for secrets management

Doppler replaces the `.env` file entirely. Secrets live in Doppler's cloud and are injected into the Docker process at runtime — nothing is stored on disk.

> **Why this approach?** You already use Doppler in GitHub Actions for another project. The same service token pattern applies here — generate a token in Doppler, configure the CLI on the VPS with it, and run containers with `doppler run --`.

---

### 8a) Create the Doppler project and environment

Go to [dashboard.doppler.com](https://dashboard.doppler.com) and:

1. Click **Create Project** → name it `sales-team`
2. Inside the project, you'll see three default environments: `dev`, `stg`, `prd`
3. Open **`prd`** (production) — this is the one the VPS will use

> You can rename or add environments, but `prd` is a good fit for the live VPS.

---

### 8b) Add your secrets to Doppler

Inside the `prd` environment, add these secrets (click **+ Add Secret** for each):

| Secret name | Value |
|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `ANTHROPIC_API_KEY` | Your Anthropic key (`sk-ant-...`) |
| `OPENCLAW_GATEWAY_TOKEN` | A long random secret (generate with: `openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from BotFather |
| `GITHUB_REPO_SSH` | `git@github.com:Cristian-Castaneda/Sales-Team.git` |

> `OPENAI_API_KEY` is no longer needed — the image builder now uses Anthropic.

---

### 8c) Generate a service token for the VPS

This is the same credential pattern you already use in GitHub Actions.

In the Doppler dashboard:

1. Go to **`sales-team`** project → **`prd`** environment
2. Click **Access** tab → **Service Tokens**
3. Click **+ Generate** → name it `openclaw-vps` → set expiry to **No expiry** (or your preferred rotation policy)
4. Copy the token — it starts with `dp.st.`

> **One token per environment per use case.** Keep the VPS token separate from your GitHub Actions token so you can revoke one without affecting the other.

---

### 8d) Install the Doppler CLI on the VPS

SSH into the VPS, then:

```bash
curl -Ls https://cli.doppler.com/install.sh | sh
doppler --version
```

---

### 8e) Configure the CLI with your service token

Scope the token to the deploy directory so `doppler run` always picks up the right project and environment automatically:

```bash
# Create the deploy directory if it doesn't exist yet
mkdir -p /opt/openclaw-deploy

# Bind the service token to that directory
doppler configure set token dp.st.YOUR_TOKEN_HERE --scope /opt/openclaw-deploy

# Confirm it works — should print all your secrets
cd /opt/openclaw-deploy
doppler secrets
```

> The `--scope` flag writes a `.doppler.yaml` file in `/opt/openclaw-deploy` that pins the project (`sales-team`) and environment (`prd`) to that directory. Any `doppler run` command executed inside that directory will automatically use this configuration — no flags needed.

---

### 8f) Verify secret injection

```bash
cd /opt/openclaw-deploy
doppler run -- printenv | grep ANTHROPIC
# Should print: ANTHROPIC_API_KEY=sk-ant-...
```

---

## 9) Deploy the Docker Compose file from the repo

Instead of writing the Docker files manually, we copy them from the repo:

```bash
cp /opt/agents/Sales-Team/docker/Dockerfile /opt/openclaw-deploy/Dockerfile
cp /opt/agents/Sales-Team/docker/docker-compose.yml /opt/openclaw-deploy/docker-compose.yml
```



> **Note**: The `openclaw` service now uses `build` instead of `image`. Docker Compose will build the custom image from `docker/Dockerfile` on the first `docker compose up --build`. The Dockerfile extends `openclaw:local` and bakes in Bun, so TypeScript is always available.
> **Note**: The openclaw service runs as user: "0:0" (root inside the container) to prevent permission errors when OpenClaw creates files in the mounted ~/.openclaw/ directory.
### About the two containers

| Container | Image | What it does |
|-----------|-------|-------------|
| `openclaw` | Built from `docker/Dockerfile` (extends `openclaw:local` + Bun) | The OpenClaw agent runtime and Gateway, with Bun baked in for native TypeScript skill execution |
| `browser` | `ghcr.io/browserless/chromium:latest` | A public headless Chromium image. No custom Dockerfile needed — Docker pulls it automatically from the GitHub Container Registry on first `docker compose up`. |

Both containers bind their ports to `127.0.0.1` only, meaning the services are **not publicly accessible** from the internet.

---

## 10) Start the containers

Always start containers via `doppler run` so secrets are injected into the environment:

```bash
cd /opt/openclaw-deploy
doppler run -- docker compose up -d --build
docker compose ps
docker compose logs -f
```

> `doppler run --` wraps the command and injects all `prd` secrets as environment variables before Docker Compose starts. The `--` separator is required — it tells the shell that everything after it is the command to run, not a Doppler flag.

At this point:
- OpenClaw should be running (with Bun baked in for TypeScript skills)
- Headless Chrome should be running
- The browser container was pulled automatically from `ghcr.io/browserless/chromium:latest`

---

## 11) Access the OpenClaw UI privately from your Mac

Because the port is only on localhost on the VPS, use an SSH tunnel from your Mac:

```bash
ssh -L 18789:127.0.0.1:18789 root@72.61.58.110
```

Then open in your Mac browser:

```txt
http://127.0.0.1:18789
```

This keeps everything private.

---
### Alternative: Use Termius port forwarding (recommended)

If you use Termius as your SSH client, you can set up a persistent port forwarding rule instead of running the SSH tunnel command manually:

1. Open Termius
2. Go to **Port Forwarding** in the sidebar
3. Click **New Forwarding**
4. Fill in:
   - **Local port**: `18789`
   - **Bind address**: `127.0.0.1`
   - **Intermediate host**: select your OpenClaw VPS host
   - **Destination address**: `127.0.0.1`
   - **Destination port**: `18789`
5. Save and toggle it on

Then open `http://127.0.0.1:18789` in your Mac browser. The tunnel stays active as long as the rule is on — no terminal commands needed.

## 12) Set up Telegram channel

The Telegram channel is already enabled in `config/openclaw.json`. You only need to do two things before starting the containers:

### 12a) Get your Telegram numeric user ID

Message **@userinfobot** on Telegram. It will instantly reply with your user ID, something like:

```
Id: 123456789
First: Cristian
```

Copy that number.

### 12b) Set the allowlist in openclaw.json

In `config/openclaw.json`, replace `YOUR_TELEGRAM_CHAT_ID` with your numeric user ID:

```json
"allowFrom": ["123456789"]
```

Commit and push, then run `deploy-pull` on the VPS to apply.

### 12c) Add the bot token to Doppler

The `TELEGRAM_BOT_TOKEN` should already be in Doppler from step 8b. If not, add it now:

1. Go to [dashboard.doppler.com](https://dashboard.doppler.com) → `sales-team` → `prd`
2. Add `TELEGRAM_BOT_TOKEN` = your bot token

(The bot token comes from [@BotFather](https://t.me/BotFather) on Telegram — `/newbot` to create one, or `/mybots` if you already have it.)

### 12d) Start the bot

After deploying the config and restarting the containers, open Telegram, find your bot by its username, and send it any message. Because `dmPolicy` is `allowlist`, only your user ID can talk to it.

---

## 13) WhatsApp channel (optional, already configured)

The WhatsApp channel is also enabled in `config/openclaw.json` with your number `+56954130924`. After starting the containers, pair via the OpenClaw onboarding/pairing flow (QR or pairing code through the Gateway UI at `http://127.0.0.1:18789`).

---

## 14) Install skills from the repo

OpenClaw skills are just folders with a `SKILL.md` file inside. There is no build step — OpenClaw reads the markdown instructions at runtime and follows them. If the skill includes scripts (like TypeScript files run by Bun), those execute when the agent triggers the skill.

Skills are loaded from `~/.openclaw/skills/`. To install a skill from the repo, copy its folder there:

```bash
# Copy the skill-builder skill (and any future skills) from the repo
mkdir -p ~/.openclaw/skills/
cp -r /opt/agents/Sales-Team/skills/* ~/.openclaw/skills/
```

After copying, verify the skill is visible:
```bash
docker compose -f /opt/openclaw-deploy/docker-compose.yml exec openclaw openclaw skills list --eligible
```

Skills load dynamically, so new skills should be available on the next conversation turn. If the skill doesn't appear, restart the gateway:
```bash
cd /opt/openclaw-deploy
docker compose restart openclaw
```

### How this works for skill-builder specifically

Your `skill-builder` skill has TypeScript scripts in `scripts/` that call the Claude API to generate new skills. Because Bun is baked into the OpenClaw container (from the Dockerfile in step 9), those TypeScript scripts run natively — no compile step needed.

The skill requires `ANTHROPIC_API_KEY` which is already in your `.env` and injected into the container.

### Adding new skills later

As you create more skills (either manually or via skill-builder), add them to `Sales-Team/skills/` in the repo, push, then on the VPS:

```bash
cd /opt/agents/Sales-Team
git pull
cp -r skills/* ~/.openclaw/skills/
```

---

## 15) Mount your repo into OpenClaw if needed

If you want OpenClaw to read files from your repo directly, add a mount to the `docker-compose.yml` in the repo:

```yaml
volumes:
  - /opt/agents/Sales-Team:/workspace/agents:ro
```

Then redeploy:
```bash
cp /opt/agents/Sales-Team/docker/Dockerfile /opt/openclaw-deploy/Dockerfile
cp /opt/agents/Sales-Team/docker/docker-compose.yml /opt/openclaw-deploy/docker-compose.yml
cd /opt/openclaw-deploy
docker compose up -d --build
```

---

## 16) Updating configs after changes

Since all config and Docker files live in the **Sales-Team** repo, the workflow for making changes is:

1. Edit the files locally (on your Mac or in GitHub)
2. Push to the repo
3. On the VPS, pull and redeploy:

```bash
cd /opt/agents/Sales-Team
git pull

# Redeploy config
cp config/openclaw.json ~/.openclaw/openclaw.json

# Redeploy Docker files
cp docker/Dockerfile /opt/openclaw-deploy/Dockerfile
cp docker/docker-compose.yml /opt/openclaw-deploy/docker-compose.yml

# Redeploy skills
cp -r skills/* ~/.openclaw/skills/

# Rebuild and restart (via Doppler so secrets are injected)
cd /opt/openclaw-deploy
doppler run -- docker compose up -d --build
```

> **Secrets change?** Update them directly in the Doppler dashboard — no SSH needed, no VPS access. They are picked up automatically on the next `doppler run` invocation.

This way you never lose your config changes — everything is versioned.

---

## 17) First verification checklist

You are done with the base system when all of this is true:

- `docker compose ps` shows `openclaw` running
- `docker compose ps` shows `browser` running
- You can open `http://127.0.0.1:18789` through SSH tunnel
- OpenClaw can answer
- WhatsApp is paired
- Your repo clones via Git SSH
- `doppler secrets` shows all keys in `/opt/openclaw-deploy`
- OpenRouter key is working
- Anthropic API key is injected and working
- `skill-builder` shows as eligible in `openclaw skills list --eligible`

---

## 18) What comes next after this

Once this base works, the next layer is:

- use skill-builder to create new skills for your marketing workflows
- define cron jobs
- add your marketing/sales prompts
- add GitHub repo workflows
- add approval rules before doing risky actions
- add more channels if needed

This file stops at the first working infrastructure layer.
