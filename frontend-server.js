const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 5000;

// Serve static frontend assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start dedicated frontend server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`💻 Frontend Client Server`);
  console.log(`🌐 Running on: http://localhost:${PORT}`);
  console.log(`🔗 Connected to Backend API: http://localhost:3000`);
  console.log(`===============================================`);
});
