import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";
import path from 'path';

const app = express();
const PORT = 5000;
const DATA_FILE = "./campaigns.json";
const CONTACTS_FILE = "./contacts.json";
const SESSIONS_FILE = "./sessions.json";

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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
