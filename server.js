const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-origin frontend requests
app.use(cors());

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Data Store: Parking slots array
// No database required - stores data during runtime
let parkingSlots = [
  {
    id: 1,
    slotNumber: 'A-01',
    isOccupied: true,
    vehicle: {
      vehicleNumber: 'MH-12-AB-1234',
      vehicleType: 'Car',
      ownerName: 'John Doe',
      parkedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 mins ago
    }
  },
  {
    id: 2,
    slotNumber: 'A-02',
    isOccupied: false,
    vehicle: null
  },
  {
    id: 3,
    slotNumber: 'A-03',
    isOccupied: true,
    vehicle: {
      vehicleNumber: 'KA-05-EV-9876',
      vehicleType: 'EV',
      ownerName: 'Sarah Smith',
      parkedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString() // 2 hours ago
    }
  },
  {
    id: 4,
    slotNumber: 'A-04',
    isOccupied: false,
    vehicle: null
  },
  {
    id: 5,
    slotNumber: 'B-01',
    isOccupied: false,
    vehicle: null
  },
  {
    id: 6,
    slotNumber: 'B-02',
    isOccupied: true,
    vehicle: {
      vehicleNumber: 'DL-01-BK-4321',
      vehicleType: 'Bike',
      ownerName: 'Rahul Verma',
      parkedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 mins ago
    }
  },
  {
    id: 7,
    slotNumber: 'B-03',
    isOccupied: false,
    vehicle: null
  },
  {
    id: 8,
    slotNumber: 'B-04',
    isOccupied: false,
    vehicle: null
  },
  {
    id: 9,
    slotNumber: 'C-01',
    isOccupied: false,
    vehicle: null
  },
  {
    id: 10,
    slotNumber: 'C-02',
    isOccupied: false,
    vehicle: null
  }
];

// Helper: Calculate parking statistics
function getStatistics() {
  const total = parkingSlots.length;
  const occupied = parkingSlots.filter(s => s.isOccupied).length;
  const available = total - occupied;
  return { total, available, occupied };
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

/**
 * GET /api/slots
 * Retrieve all parking slots and current statistics
 */
app.get('/api/slots', (req, res) => {
  res.json({
    success: true,
    stats: getStatistics(),
    data: parkingSlots
  });
});

/**
 * GET /api/stats
 * Retrieve overview statistics (total, available, occupied)
 */
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: getStatistics()
  });
});

/**
 * POST /api/slots/:id/park
 * Park a vehicle in a specific slot
 * Expected body: { vehicleNumber, vehicleType, ownerName }
 */
app.post('/api/slots/:id/park', (req, res) => {
  const slotId = parseInt(req.params.id, 10);
  const { vehicleNumber, vehicleType, ownerName } = req.body;

  // Validation: Required fields
  if (!vehicleNumber || !vehicleType || !ownerName) {
    return res.status(400).json({
      success: false,
      message: 'All fields (vehicleNumber, vehicleType, ownerName) are required.'
    });
  }

  // Find slot
  const slot = parkingSlots.find(s => s.id === slotId);

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: `Slot with ID ${slotId} not found.`
    });
  }

  if (slot.isOccupied) {
    return res.status(400).json({
      success: false,
      message: `Slot ${slot.slotNumber} is already occupied by ${slot.vehicle.vehicleNumber}.`
    });
  }

  // Park vehicle into slot
  slot.isOccupied = true;
  slot.vehicle = {
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    vehicleType: vehicleType.trim(),
    ownerName: ownerName.trim(),
    parkedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    message: `Vehicle ${slot.vehicle.vehicleNumber} successfully parked in Slot ${slot.slotNumber}.`,
    data: slot,
    stats: getStatistics()
  });
});

/**
 * POST /api/slots/:id/release
 * Release an occupied parking slot
 */
app.post('/api/slots/:id/release', (req, res) => {
  const slotId = parseInt(req.params.id, 10);
  const slot = parkingSlots.find(s => s.id === slotId);

  if (!slot) {
    return res.status(404).json({
      success: false,
      message: `Slot with ID ${slotId} not found.`
    });
  }

  if (!slot.isOccupied) {
    return res.status(400).json({
      success: false,
      message: `Slot ${slot.slotNumber} is already free.`
    });
  }

  const releasedVehicle = slot.vehicle;
  slot.isOccupied = false;
  slot.vehicle = null;

  res.status(200).json({
    success: true,
    message: `Slot ${slot.slotNumber} has been released. Vehicle ${releasedVehicle.vehicleNumber} has exited.`,
    data: slot,
    stats: getStatistics()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🅿️  Parking Slot Management Board`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
