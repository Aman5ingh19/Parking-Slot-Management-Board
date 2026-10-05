# 🅿️ Parking Slot Management Board

A clean, beginner-friendly **Parking Slot Management Board** web application built using **HTML5, Bootstrap 5, Vanilla JavaScript**, and a lightweight **Node.js + Express** backend.

This project simulates a live parking lot management system where an operator can monitor slot status, park incoming vehicles with relevant owner and vehicle details, and release slots once vehicles leave.

---

## 📌 Features

* **Responsive Bootstrap Grid Layout:** View all parking slots in a modern, mobile-responsive card grid.
* **Real-Time Slot Status:** Color-coded badges and cards:
  * 🟢 **Available (Vacant):** Slot is free for new vehicles.
  * 🔴 **Occupied:** Displays vehicle number, category, owner name, and parking timestamp.
* **Park a Vehicle (Modal Form):**
  * Select or pre-fill an available slot.
  * Input vehicle registration number.
  * Select vehicle category (Car, SUV, Bike, Electric Vehicle, Truck).
  * Enter owner/driver name.
* **Release Slot:** Mark any occupied parking slot as available with a confirmation dialog.
* **Live Overview Statistics:** Real-time summary cards displaying:
  * Total Slots
  * Available Slots
  * Occupied Slots
* **Interactive Filtering & Search:**
  * Quick filter buttons: *All Slots*, *Available Only*, *Occupied Only*.
  * Instant search by slot number, vehicle plate, or owner name.
* **No Database Required:** Stores slots and vehicle records in an in-memory JavaScript array on the Node.js server.
* **RESTful APIs:** Clean Express endpoints for fetching, parking, and releasing slots.

---

## 🛠️ Tech Stack

* **Frontend:**
  * **HTML5:** Semantic document structure.
  * **Bootstrap 5.3 (via CDN):** Responsive grid, navbar, cards, badges, modal, forms, and alerts.
  * **Bootstrap Icons (via CDN):** Visual indicators and icons.
  * **Vanilla JavaScript (ES6+):** Async `fetch()` API calls, dynamic DOM manipulation, and event handling.
  * **Custom CSS (`style.css`):** Subtle card animations, license plate styling, and responsive polish.
* **Backend:**
  * **Node.js (v18+ recommended):** JavaScript runtime.
  * **Express.js (v4):** Web framework to serve static files and REST API endpoints.
* **Data Storage:**
  * **In-Memory JavaScript Array:** Temporary runtime storage (`parkingSlots[]`). No external database setup needed.

---

## 📂 Folder Structure

```text
parking-slot-management-board/
│
├── public/                     # Static client-side files served by Express
│   ├── css/
│   │   └── style.css           # Custom styling and enhancements
│   ├── js/
│   │   └── app.js              # Client-side logic, API calls, and DOM rendering
│   └── index.html              # Main single-page web dashboard
│
├── server.js                   # Node.js + Express backend server & REST APIs
├── package.json                # Project metadata, dependencies, and run scripts
└── README.md                   # Project documentation and guide
```

---

## 🔌 REST API Endpoints

The backend provides simple REST APIs under the `/api` namespace:

### 1. Get All Parking Slots & Stats
* **Method:** `GET`
* **URL:** `/api/slots`
* **Description:** Retrieves all parking slots and summary stats.
* **Sample Response:**
  ```json
  {
    "success": true,
    "stats": {
      "total": 10,
      "available": 7,
      "occupied": 3
    },
    "data": [
      {
        "id": 1,
        "slotNumber": "A-01",
        "isOccupied": true,
        "vehicle": {
          "vehicleNumber": "MH-12-AB-1234",
          "vehicleType": "Car",
          "ownerName": "John Doe",
          "parkedAt": "2026-10-05T08:45:00.000Z"
        }
      },
      {
        "id": 2,
        "slotNumber": "A-02",
        "isOccupied": false,
        "vehicle": null
      }
    ]
  }
  ```

---

### 2. Get Parking Statistics
* **Method:** `GET`
* **URL:** `/api/stats`
* **Description:** Retrieves overall counts (`total`, `available`, `occupied`).
* **Sample Response:**
  ```json
  {
    "success": true,
    "data": {
      "total": 10,
      "available": 7,
      "occupied": 3
    }
  }
  ```

---

### 3. Park a Vehicle in a Slot
* **Method:** `POST`
* **URL:** `/api/slots/:id/park`
* **URL Parameter:** `id` (Number) - The numeric ID of the parking slot (e.g. `2`).
* **Request Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "vehicleNumber": "DL-05-XY-9999",
    "vehicleType": "SUV",
    "ownerName": "Alex Johnson"
  }
  ```
* **Validation Rules:**
  * `vehicleNumber`, `vehicleType`, and `ownerName` must be non-empty strings.
  * The slot must exist and must currently be available (`isOccupied === false`).
* **Sample Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vehicle DL-05-XY-9999 successfully parked in Slot A-02.",
    "data": {
      "id": 2,
      "slotNumber": "A-02",
      "isOccupied": true,
      "vehicle": {
        "vehicleNumber": "DL-05-XY-9999",
        "vehicleType": "SUV",
        "ownerName": "Alex Johnson",
        "parkedAt": "2026-10-05T09:30:00.000Z"
      }
    },
    "stats": {
      "total": 10,
      "available": 6,
      "occupied": 4
    }
  }
  ```

---

### 4. Release an Occupied Slot
* **Method:** `POST`
* **URL:** `/api/slots/:id/release`
* **URL Parameter:** `id` (Number) - The numeric ID of the slot to release.
* **Sample Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Slot A-02 has been released. Vehicle DL-05-XY-9999 has exited.",
    "data": {
      "id": 2,
      "slotNumber": "A-02",
      "isOccupied": false,
      "vehicle": null
    },
    "stats": {
      "total": 10,
      "available": 7,
      "occupied": 3
    }
  }
  ```

---

## 🚀 Setup & How to Run

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org/) installed (v18.0.0 or later). Check with:
  ```bash
  node -v
  npm -v
  ```

### Step 1: Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### Step 2: Start the Servers

You have two options depending on your workflow:

#### Option A: Run Both Servers (Frontend + Backend)
* **Backend API Server (Port 3000):**
  ```bash
  npm run backend
  ```
  *(Runs `server.js` with CORS enabled for REST endpoints at `http://localhost:3000/api/slots`)*

* **Frontend Client Server (Port 5000):**
  ```bash
  npm run frontend
  ```
  *(Serves the frontend board on `http://localhost:5000` and connects to the backend API)*

#### Option B: Unified Fullstack Mode (Single Port 3000)
* Run:
  ```bash
  npm start
  ```
  *(Serves both the web UI and REST API on `http://localhost:3000`)*

### Step 3: Open in Browser
Open your browser and visit:
* Frontend Client URL: **http://localhost:5000**
* Or Fullstack URL: **http://localhost:3000**

---

## 💡 How to Use the Application

1. **View Parking Status:** When the page loads, you will see 10 parking slots with live indicators (Total, Available, and Occupied count).
2. **Park a Vehicle:**
   * Either click **"Park Vehicle"** in the top navigation bar or click **"Park Vehicle"** directly on any available green slot card.
   * Enter the **Vehicle Registration Number**, select the **Vehicle Type**, and enter the **Owner Name**.
   * Click **"Assign & Park"**. The slot card will immediately update to Occupied.
3. **Release a Slot:**
   * Find any occupied slot (red card) and click **"Release Slot"**.
   * Confirm the prompt in the popup modal.
   * The slot will be freed immediately and become available for new vehicles.
4. **Search and Filter:**
   * Use the **All / Available / Occupied** toggle pills to filter the grid view.
   * Type in the search box to find specific slots or vehicles by registration number or owner name.

---

## ⚠️ Limitations & Beginner Notes

* **In-Memory Storage:** Parking slot data is stored in memory (`parkingSlots` array in `server.js`). Restarting or stopping the Node server resets the slots to their initial state.
* **No Authentication:** Designed for open demonstration or single-operator kiosk use without login credentials.
* **No Billing / Payments:** Focuses solely on parking allocation and status management without calculation of parking fees.
* **Concurrent Sync:** Updates are fetched on user actions. Multi-tab synchronization is achieved via manual or action-triggered refresh rather than WebSockets.

---

## 📄 License
This project is open-source and free to use for learning, educational, or prototype purposes.
