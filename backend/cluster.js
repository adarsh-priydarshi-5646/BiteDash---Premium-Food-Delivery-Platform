/**
 * Cluster Mode Entry Point
 * Spawns worker processes equal to CPU cores for maximum throughput
 * Auto-restarts crashed workers for high availability
 * 
 * Usage: node cluster.js (instead of node index.js)
 */
import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers for ${numCPUs} CPU cores`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Auto-restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM. Shutting down workers...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });

} else {
  // Workers run the actual server
  import('./index.js');
  console.log(`Worker ${process.pid} started`);
}
