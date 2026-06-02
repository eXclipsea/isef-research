# Installing the prerequisites (macOS)

ResearchOS needs three free tools before you run `./setup.sh`:
**Ollama** (the local AI), **Node.js**, and **Python 3.11+**.

There are two ways to install them. **Option A (Homebrew)** is one command for
all three and is the easiest. **Option B** downloads each one by hand.

When you're done, jump to [Verify](#verify) and then [Run setup](#run-setup).

---

## Option A — Homebrew (recommended)

Homebrew is a free installer for Mac. You install it once, then it installs
the other tools for you.

### 1. Install Homebrew

Open the **Terminal** app (press `Cmd+Space`, type "Terminal", Enter) and paste:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts (it may ask for your Mac password — typing it shows nothing,
that's normal). When it finishes, it may print two `eval` lines telling you to
run them — copy/paste and run those so `brew` works in your terminal.

Check it worked:

```bash
brew --version
```

### 2. Install Node.js and Python with one command

```bash
brew install node python3
```

### 3. Install Ollama

```bash
brew install --cask ollama
```

(If that doesn't work, use the download from Option B step 3 instead.)

Then **open the Ollama app once** from your Applications folder so it can
finish setting up. You can close it after — `setup.sh` will start it when needed.

Now go to [Verify](#verify).

---

## Option B — Download each app manually

### 1. Python 3.11+

1. Go to **https://www.python.org/downloads/**
2. Click the big **Download Python** button.
3. Open the downloaded `.pkg` and click through the installer (Continue →
   Agree → Install).

### 2. Node.js

1. Go to **https://nodejs.org**
2. Click the **LTS** download (the left button).
3. Open the downloaded `.pkg` and click through the installer.

### 3. Ollama

1. Go to **https://ollama.com/download**
2. Click **Download for macOS**.
3. Unzip it and drag **Ollama** into your **Applications** folder.
4. **Open Ollama once** so it finishes setup. You can close it afterward.

Now go to [Verify](#verify).

---

## Verify

Open Terminal and run these one at a time — each should print a version number,
not "command not found":

```bash
python3 --version     # e.g. Python 3.12.x  (3.11 or newer is fine)
node --version        # e.g. v20.x or v22.x
npm --version         # e.g. 10.x
ollama --version      # e.g. ollama version 0.x
git --version         # e.g. git version 2.x  (usually already on macOS)
```

If `git` says "command not found", run `xcode-select --install` and click
**Install** in the popup, then try again.

If any of the others is missing, re-do its step above. If you just installed
Homebrew, you may need to **quit and reopen Terminal** first.

---

## Run setup

Once all five commands above print a version, you're ready:

```bash
git clone https://github.com/eXclipsea/isef-research.git
cd isef-research
./setup.sh
```

`setup.sh` installs everything else (it downloads the AI models, which is a
one-time ~2 GB download, so give it a few minutes on the first run).

Then start the app:

```bash
./start.sh
```

…or double-click **ResearchOS.app**. It opens at http://localhost:8000.

**No API keys are required** — search and papers work out of the box.

---

## Troubleshooting

- **"`./setup.sh` permission denied"** → run `chmod +x setup.sh start.sh` then retry.
- **"command not found: brew"** after installing Homebrew → run the two `eval`
  lines Homebrew printed, or quit and reopen Terminal.
- **Ollama errors / "could not connect"** → open the Ollama app once from
  Applications, then re-run `./start.sh`.
- **Stuck?** Check the logs in the project folder: `backend/backend.log`,
  `searxng/searxng.log`, and `app-launch.log`.
