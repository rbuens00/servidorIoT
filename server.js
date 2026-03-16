require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const { startBroker } = require('./services/broker');
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/devices.routes');
const readingRoutes = require('./routes/readings.routes');

const app = express();
const port = 3000;

// Conectar a la base de datos
connectDB();

// Arrancar broker MQTT
startBroker();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Rutas
app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);
app.use('/readings', readingRoutes);

// Ruta de prueba
app.get('/test', (req, res) => res.json({ msg: 'El API REST funciona!' }));

// Iniciar servidor
app.listen(port, () => console.log(`Servidor corriendo en el puerto ${port}`));
