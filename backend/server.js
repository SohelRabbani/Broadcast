const express = require('express');
const mongoose = require('mongoose');
const path = require('node:path');
const fs = require('node:fs');
const Booking = require('./models/Booking');
const Service = require('./models/Service');

const frontend = fs.existsSync(path.join(__dirname, '../public'))
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../frontend');
const catalog = fs.existsSync(path.join(__dirname, '../public/services.json'))
  ? require('../public/services.json')
  : require('../frontend/services.json');

const app = express();
let databaseReady = false;
let dbConnectPromise = null;

async function connectDB() {
  if (databaseReady && mongoose.connection.readyState === 1) return true;
  if (!process.env.MONGO_URI) return false;
  if (!dbConnectPromise) {
    dbConnectPromise = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
      .then(async () => {
        await Service.init();
        await Service.bulkWrite(catalog.map(service => ({
          updateOne: { filter: { slug: service.slug }, update: { $setOnInsert: service }, upsert: true }
        })));
        databaseReady = true;
        return true;
      })
      .catch(error => {
        dbConnectPromise = null;
        console.error('Database connection failed:', error.message);
        return false;
      });
  }
  return dbConnectPromise;
}

app.use(express.json({ limit: '8kb' }));

// CORS headers to support cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Lazy-connect DB for serverless environments
app.use(async (req, res, next) => {
  if (!databaseReady && process.env.MONGO_URI) {
    await connectDB();
  }
  next();
});

app.get('/api/services', async (req, res) => {
  if (!databaseReady) return res.json(catalog);
  try {
    const services = await Service.find({}, '-_id -__v').sort({ _id: 1 }).lean();
    res.json(services.length > 0 ? services : catalog);
  } catch {
    res.json(catalog);
  }
});

app.post('/api/bookings', async (req, res) => {
  const { name, phone, service, date } = req.body ?? {};
  const parsedDate = typeof date === 'string' ? new Date(date) : new Date(NaN);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (
    typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
    typeof phone !== 'string' || !/^\+?[\d ()-]{7,24}$/.test(phone.trim()) ||
    phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15 ||
    typeof service !== 'string' ||
    !Number.isFinite(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date ||
    date < today
  ) {
    return res.status(400).json({ message: 'Enter a name, valid phone number, service and current or future date.' });
  }
  if (!databaseReady || mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Online booking is temporarily unavailable.' });
  }
  if (!(await Service.exists({ slug: service }))) {
    return res.status(400).json({ message: 'Select a service from the list.' });
  }
  const booking = await Booking.create({ name: name.trim(), phone: phone.trim(), service, date });
  res.status(201).json({ success: true, message: 'Booking request received. Your session is pending confirmation.', id: booking.id });
});

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use(express.static(frontend));
app.get(['/', '/services', '/gallery', '/pricing', '/booking', '/reviews', '/contact'], (req, res) => {
  res.sendFile(path.join(frontend, 'index.html'));
});
app.use((error, req, res, next) => {
  const status = error.status === 400 || error.status === 413 ? error.status : 500;
  if (status === 500) console.error(error.message);
  res.status(status).json({ message: status === 500 ? 'Something went wrong. Please try again.' : 'Invalid request.' });
});

async function start() {
  await connectDB();
  if (!databaseReady) {
    console.log('Preview mode. Set MONGO_URI to enable bookings.');
  }
  const port = process.env.PORT || 5050;
  app.listen(port, () => console.log('Broadcast Podcast running on port ' + port));
}

if (require.main === module) {
  start().catch(error => {
    console.error('Startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = app;
