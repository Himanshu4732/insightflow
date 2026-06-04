import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function initWebsocket(io: Server) {
  ioInstance = io;
  console.log('WebSocket connection service initialized.');

  io.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room for specific organization so messages are scoped
    socket.on('join_org', (orgId: string) => {
      socket.join(orgId);
      console.log(`Socket ${socket.id} joined organisation room: ${orgId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  // Simulated live KPIs stream (every 5 seconds)
  let currentRevenue = 284920;
  let currentOrders = 3842;

  setInterval(() => {
    // Fluctuate values slightly
    const revDelta = (Math.random() - 0.5) * 850;
    const ordersDelta = Math.random() > 0.6 ? 1 : 0;

    currentRevenue = Math.max(0, currentRevenue + revDelta);
    currentOrders = Math.max(0, currentOrders + ordersDelta);

    io.emit('kpi_update', {
      revenue: Math.round(currentRevenue),
      orders: currentOrders
    });
  }, 5000);

  // Simulated occasional anomaly alerts (every 30 seconds, 30% trigger rate)
  const simulatedMetrics = [
    'CPU threshold overload warning',
    'Payment gateway response delay',
    'Anomaly signup density spike',
    'Database lock concurrency peak'
  ];
  const simulatedDescriptions = [
    'Core processes reported 94% resource utilization on cluster web-node-03.',
    'Stripe webhook callback timeout exceeded 4500ms threshold latency standard.',
    'Detected 78 user registration events within 90s from single gateway subnet.',
    'Write query queue lock duration exceeded 1200ms bounds in catalog schema.'
  ];

  setInterval(() => {
    if (Math.random() > 0.7) {
      const idx = Math.floor(Math.random() * simulatedMetrics.length);
      const severities: ('red' | 'amber' | 'green')[] = ['red', 'amber', 'green'];
      const chosenSeverity = severities[Math.floor(Math.random() * 3)];

      const newAlert = {
        id: `live-a-${Math.random().toString(36).substring(2, 6)}`,
        severity: chosenSeverity,
        metric: simulatedMetrics[idx],
        description: simulatedDescriptions[idx],
        time: 'Just now'
      };

      io.emit('anomaly_alert', newAlert);
      console.log(`[WS Live Alert] Dispatched: ${simulatedMetrics[idx]}`);
    }
  }, 30000);
}

// Broadcasts real row insertions
export function emitRowInsert(orgId: string, datasetId: string, row: any) {
  if (ioInstance) {
    // Scope to specific organization room
    ioInstance.to(orgId).emit('row_insert', { datasetId, row });
    // Also emit globally for developer convenience during demo testing
    ioInstance.emit('row_insert', { datasetId, row });
    console.log(`[WS Broadcast] Inserted row notified for dataset: ${datasetId}`);
  }
}
