# OpenClaw VPS Blueprint

This is the minimal step-by-step blueprint to get a **private OpenClaw server** running on your **Hostinger Ubuntu VPS** using **SSH from your Mac**, with:

- OpenClaw in Docker (Container 1)
- Headless Chrome in Docker (Container 2 — uses the public `ghcr.io/browserless/chromium` image, no custom Dockerfile needed)
- Private access only
- WhatsApp as the chat channel
- OpenRouter as main model
- Anthropic API and OpenAI API also configured
- GitHub access via SSH key (.pem / private key)
- `.env` file for secrets (created manually on VPS, never committed to the repo)
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
    |       +-- workflows/
    |           +-- daily_5_posts.md
    |
    +-- openclaw-deploy/                     <- Live deployment (Docker runs here)
        +-- .env                                 API keys and secrets (NEVER in repo)
        +-- Dockerfile                           Copied from Sales-Team/docker/
        +-- docker-compose.yml                   Copied from Sales-Team/docker/
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
├── skills/
│   └── skill-builder/             # Meta-skill that generates new OpenClaw skills
│       ├── SKILL.md               # Skill instructions (read by OpenClaw at runtime)
│       └── scripts/               # TypeScript scripts (run by Bun, no build step)
├── .gitignore                     # Must include .env
└── ...                            # Your other project files
```

> **The `.env` file is never committed.** It is created manually on the VPS and referenced by Docker Compose from the deploy directory.

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
chmod -R a-w /opt/agents/Sales-Team
chmod -R u+w /opt/agents/Sales-Team/.git
```

From now on, whenever you push changes from your Mac, on the VPS just run:
```bash
deploy-pull
```

This unlocks the repo, pulls, copies all files to their active locations, and locks it again.
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

## 8) Create the secrets file on the VPS

This file is **never committed to the repo**. Create it manually:

```bash
mkdir -p /opt/openclaw-deploy
cd /opt/openclaw-deploy
nano .env
```

Put this inside:

```env
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY

OPENCLAW_GATEWAY_TOKEN=PUT_A_LONG_RANDOM_SECRET_HERE

GITHUB_REPO_SSH=git@github.com:Cristian-Castaneda/Sales-Team.git
```

---

## 9) Deploy the Docker Compose file from the repo

Instead of writing the Docker files manually, we copy them from the repo:

```bash
cp /opt/agents/Sales-Team/docker/Dockerfile /opt/openclaw-deploy/Dockerfile
cp /opt/agents/Sales-Team/docker/docker-compose.yml /opt/openclaw-deploy/docker-compose.yml
```



> **Note**: The `openclaw` service now uses `build` instead of `image`. Docker Compose will build the custom image from `docker/Dockerfile` on the first `docker compose up --build`. The Dockerfile extends `openclaw:local` and bakes in Bun, so TypeScript is always available.

### About the two containers

| Container | Image | What it does |
|-----------|-------|-------------|
| `openclaw` | Built from `docker/Dockerfile` (extends `openclaw:local` + Bun) | The OpenClaw agent runtime and Gateway, with Bun baked in for native TypeScript skill execution |
| `browser` | `ghcr.io/browserless/chromium:latest` | A public headless Chromium image. No custom Dockerfile needed — Docker pulls it automatically from the GitHub Container Registry on first `docker compose up`. |

Both containers bind their ports to `127.0.0.1` only, meaning the services are **not publicly accessible** from the internet.

---

## 10) Start the containers

```bash
cd /opt/openclaw-deploy
docker compose up -d --build
docker compose ps
docker compose logs -f
```

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
3. Click **+ New Rule**
4. Set: Type = Local, Local port = `18789`, Remote host = `127.0.0.1`, Remote port = `18789`, Via host = your OpenClaw VPS
5. Save and toggle it on

Then open `http://127.0.0.1:18789` in your Mac browser. The tunnel stays active as long as the rule is on — no terminal commands needed.

## 12) Set up WhatsApp channel

The WhatsApp channel is already enabled in the `config/openclaw.json` we deployed in step 7. After starting the containers, pair the WhatsApp account using the OpenClaw onboarding/pairing flow.

OpenClaw docs show:
- WhatsApp is a supported channel
- pairing mode is the default DM control
- pairing requests can be approved via CLI if needed

---

## 13) Optional: WhatsApp Cloud API path

If you want official Meta Cloud API instead of WhatsApp Web, there is a current plugin/project for OpenClaw WhatsApp Cloud API setup.

For now, the fastest path is:
- start with built-in WhatsApp channel
- pair by QR
- confirm inbound/outbound messages work

---

## 14) Install skills from the repo

OpenClaw skills are just folders with a `SKILL.md` file inside. There is no build step — OpenClaw reads the markdown instructions at runtime and follows them. If the skill includes scripts (like TypeScript files run by Bun), those execute when the agent triggers the skill.

Skills are loaded from `~/.openclaw/skills/`. To install a skill from the repo, copy its folder there:

```bash
# Copy the skill-builder skill (and any future skills) from the repo
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

# Rebuild and restart
cd /opt/openclaw-deploy
docker compose up -d --build
```

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
- OpenRouter key is working
- Anthropic and OpenAI keys are stored as fallbacks
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
