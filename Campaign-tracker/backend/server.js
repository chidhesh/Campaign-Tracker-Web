import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import path from 'path';
import os from 'os';

const app = express();
const PORT = 5000;
// Determine data directory: prefer environment variable (useful on hosting)
// Fall back to user's home directory. If that path is not writable on the
// host (some PaaS have read-only home dirs), fall back to a local `data/`
// folder inside the project so the server still works.
const REQUESTED_DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), 'CampaignTrackerData');
let DATA_DIR = REQUESTED_DATA_DIR;
let DATA_DIR_WRITABLE = false;

// Helper to build file paths inside DATA_DIR
const dataPath = (name) => path.join(DATA_DIR, name);
let DATA_FILE = dataPath('campaigns.json');
let CONTACTS_FILE = dataPath('contacts.json');
let SESSIONS_FILE = dataPath('sessions.json');

// If repository still contains older files in the backend folder, we'll
// migrate them to the home data directory on first run (only if target missing).
const REPO_DATA_CAMPAIGNS = path.resolve(process.cwd(), 'campaigns.json');
const REPO_DATA_CONTACTS = path.resolve(process.cwd(), 'contacts.json');
const REPO_DATA_SESSIONS = path.resolve(process.cwd(), 'sessions.json');

// Allow all origins and log origin for debugging (accept 'null' from file://)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like file://) and all other origins
    callback(null, true);
  },
  methods: ['GET','POST','PATCH','DELETE','OPTIONS']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Ensure data directory exists and is writable. If the requested directory
// cannot be created or isn't writable (common on some hosted platforms),
// fall back to a local 'data' directory inside the app.
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // test writability
  fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
  DATA_DIR_WRITABLE = true;
} catch (err) {
  console.warn(`Data dir '${REQUESTED_DATA_DIR}' not writable or inaccessible: ${err.message || err}`);
  // fallback to local data folder inside project
  DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
    DATA_DIR_WRITABLE = true;
    console.info(`Falling back to local data dir: ${DATA_DIR}`);
  } catch (err2) {
    // if still not writable, continue but note that writes will fail
    DATA_DIR_WRITABLE = false;
    console.error(`Local fallback data dir '${DATA_DIR}' is not writable: ${err2.message || err2}`);
  }
}

// recompute file paths in case DATA_DIR changed
DATA_FILE = dataPath('campaigns.json');
CONTACTS_FILE = dataPath('contacts.json');
SESSIONS_FILE = dataPath('sessions.json');

// Migrate existing repo files into home data directory if target files do not exist
try {
  if (fs.existsSync(REPO_DATA_CAMPAIGNS) && !fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(REPO_DATA_CAMPAIGNS, DATA_FILE);
    console.log('Migrated campaigns.json to', DATA_FILE);
  }
  if (fs.existsSync(REPO_DATA_CONTACTS) && !fs.existsSync(CONTACTS_FILE)) {
    fs.copyFileSync(REPO_DATA_CONTACTS, CONTACTS_FILE);
    console.log('Migrated contacts.json to', CONTACTS_FILE);
  }
  if (fs.existsSync(REPO_DATA_SESSIONS) && !fs.existsSync(SESSIONS_FILE)) {
    fs.copyFileSync(REPO_DATA_SESSIONS, SESSIONS_FILE);
    console.log('Migrated sessions.json to', SESSIONS_FILE);
  }
} catch (err) {
  console.error('Migration error:', err.message || err);
}

// Simple request logger to help debug client requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}  Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

// Serve frontend static files from sibling `frontend` directory so the UI
// can be loaded from the same origin as the API (avoids file:// / CORS issues).
const FRONTEND_DIR = path.resolve(process.cwd(), '..', 'frontend');
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
  // optional: serve index.html at root
  app.get('/', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'index.html')));
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]");
}
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, "[]");
}
if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, "[]");
}
// Read campaigns
app.get("/api/campaigns", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]");
  res.json(data);
});

// Add a campaign
app.post("/api/campaigns", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]");
  const newCampaign = { id: Date.now(), ...req.body };
  data.push(newCampaign);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json(newCampaign);
});

// Update status
app.patch("/api/campaigns/:id", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]");
  const campaign = data.find((c) => c.id == req.params.id);
  if (campaign) {
    campaign.status = req.body.status;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(campaign);
  } else res.status(404).json({ message: "Not found" });
});

// Delete campaign
app.delete("/api/campaigns/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]");
  data = data.filter((c) => c.id != req.params.id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json({ message: "Deleted" });
});

// Receive contact messages and persist to contacts.json
app.post('/api/contact', (req, res) => {
  try {
    const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8') || '[]');
    const msg = { id: Date.now(), ...req.body, receivedAt: new Date().toISOString() };
    contacts.push(msg);
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    res.status(201).json({ message: 'Received', data: msg });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ message: 'Failed to save message' });
  }
});

// Dummy login endpoint - accepts a single credential pair and returns a token
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    // simple hard-coded credential for demo purposes
    if (username === 'admin' && password === '123') {
      // generate a unique token per login
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8') || '[]');
      const entry = { token, username, issuedAt: new Date().toISOString() };
      sessions.push(entry);
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
      return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify token endpoint
app.post('/api/verify', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ valid: false });
    const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8') || '[]');
    const found = sessions.find(s => s.token === token);
    if (found) return res.json({ valid: true, username: found.username });
    return res.status(401).json({ valid: false });
  } catch (err) {
    console.error('Verify error', err);
    return res.status(500).json({ valid: false });
  }
});

// Logout: remove token from sessions
app.post('/api/logout', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false });
    let sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8') || '[]');
    sessions = sessions.filter(s => s.token !== token);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    return res.json({ success: true });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Requested DATA_DIR: ${REQUESTED_DATA_DIR}`);
  console.log(`Using DATA_DIR: ${DATA_DIR} (writable: ${DATA_DIR_WRITABLE})`);
  console.log(`Campaigns: ${DATA_FILE}`);
  console.log(`Contacts: ${CONTACTS_FILE}`);
  console.log(`Sessions: ${SESSIONS_FILE}`);
  if (!DATA_DIR_WRITABLE) console.warn('Warning: data directory is not writable; saving will fail on this host. Configure DATA_DIR to a writable path or use a database.');
});
