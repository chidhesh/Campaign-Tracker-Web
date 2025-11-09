#  Campaign Tracker

**Campaign Tracker** is a responsive web application designed to help marketing teams manage their campaigns effectively.  
It provides a simple and intuitive interface where users can add, view, update, and delete marketing campaigns — making campaign management streamlined and efficient.

---

 Features

-  **Add New Campaigns** — Create and store campaign details including name, client, start date, and status.  
-  **View Campaigns** — Display all campaigns in a clean, responsive layout.  
-  **Update Campaign Status** — Easily switch between *Active*, *Paused*, or *Completed*.  
-  **Delete Campaigns** — Remove outdated or completed campaigns.  
-  **Modern Web Design** — Includes navigation bar, hero section, and footer for a complete professional look.  
-  **Smooth Animations** — Sections appear dynamically on scroll using CSS transitions and JavaScript.  
-  **Responsive Layout** — Optimized for desktop, tablet, and mobile devices.

---

##  Project Structure

```
Campaign-Tracker/
│
├── frontend/
│   ├── index.html       # Main webpage layout
│   ├── styles.css       # Styling and animations
│   └── script.js        # Frontend logic for campaign CRUD
│
├── backend/
│   ├── server.js        # Node.js + Express backend
│   ├── routes/          # API route handlers
│   ├── data/            # JSON storage or MongoDB config
│   └── package.json     # Dependencies and scripts
│
└── README.md            # Project documentation
```

---

##  Frontend Overview

The frontend is built using **HTML**, **CSS**, and **JavaScript**.  
It includes:
- A **navbar** for navigation  
- A **hero section** introducing the app  
- A **form section** to add new campaigns  
- A **campaign list section** displaying all entries  
- A **footer** with additional information  

JavaScript dynamically handles user interactions and communicates with the backend API using `fetch()`.

---

## ⚙️ Backend Overview

The backend is built using **Node.js with Express** (or can be implemented in **Python Flask**).  
It provides RESTful APIs for managing campaigns.

**Available API Routes:**
| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/campaigns` | Retrieve all campaigns |
| POST | `/api/campaigns` | Add a new campaign |
| PUT | `/api/campaigns/:id` | Update campaign details |
| PUT | `/api/campaigns/:id/status` | Update only the campaign’s status |
| DELETE | `/api/campaigns/:id` | Delete a campaign |

Data is stored persistently using a **JSON file**.

---

##  About the Project

> **Campaign Tracker** is a web application designed to help marketing teams manage their campaigns effectively.  
> With features like real-time tracking, status updates, and comprehensive analytics, Campaign Tracker simplifies the process of campaign management.  
> Our platform empowers teams to stay organized, monitor performance, and make data-driven decisions with ease.  
> From launching new initiatives to tracking multiple clients, Campaign Tracker provides the flexibility and control modern marketing teams need.

---

##  Scroll Animations

The About section includes a smooth scroll-triggered animation:
```css
transition: transform 700ms cubic-bezier(.2, .9, .2, 1);
```
This gives elements a fluid “fade-in and slide-up” effect as they enter view, enhancing user experience.

---

##  Getting Started

### Prerequisites
- Node.js (v16 or later)
### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/campaign-tracker.git
cd campaign-tracker/backend

# Install dependencies
npm install

# Run the server
npm start
```

### Frontend Setup
Simply open `frontend/index.html` in your browser or serve it using a simple local server.

---

##  License

This project is open-source and available under the **MIT License**.
