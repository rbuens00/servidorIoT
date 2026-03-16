const net = require('node:net');
const http = require('node:http');
const { Aedes } = require('aedes');
const { WebSocketServer, createWebSocketStream } = require('ws');
const { dispatch } = require('./mqtt-handlers');

async function startBroker() {
    const MQTT_PORT = process.env.MQTT_PORT || 1883;
    const WS_PORT   = process.env.MQTT_WS_PORT || 8888;

    const aedes = await Aedes.createBroker();
    const mqttServer = net.createServer(aedes.handle);
    const httpServer = http.createServer();
    const wss = new WebSocketServer({ server: httpServer });

    mqttServer.listen(MQTT_PORT, () =>
        console.log(`[MQTT] Broker TCP escuchando en el puerto ${MQTT_PORT}`)
    );

    wss.on('connection', (websocket, req) => {
        const stream = createWebSocketStream(websocket);
        aedes.handle(stream, req);
    });

    httpServer.listen(WS_PORT, () =>
        console.log(`[MQTT] Broker WebSocket escuchando en el puerto ${WS_PORT}`)
    );

    aedes.on('client', (client) =>
        console.log(`[MQTT] Cliente conectado    → ${client ? client.id : 'desconocido'}`)
    );

    aedes.on('clientDisconnect', (client) =>
        console.log(`[MQTT] Cliente desconectado → ${client ? client.id : 'desconocido'}`)
    );

    aedes.on('publish', (packet, client) => {
        if (!client) return;
        console.log(`[MQTT] Mensaje en ${packet.topic}: ${packet.payload?.toString?.() ?? ''}`);
        dispatch(packet.topic, packet.payload);
    });

    aedes.on('subscribe', (subscriptions, client) => {
        if (!client) return;
        subscriptions.forEach((s) =>
            console.log(`[MQTT] Suscripción: ${client.id} -> ${s.topic}`)
        );
    });

    function stopBroker() {
        wss.close();
        httpServer.close();
        mqttServer.close(() => aedes.close());
    }

    return { stopBroker, ports: { mqtt: MQTT_PORT, ws: WS_PORT } };
}

module.exports = { startBroker };
