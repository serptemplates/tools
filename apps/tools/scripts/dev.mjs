import { spawn } from "node:child_process";
import net from "node:net";

const preferred = Number(process.env.PORT) || 3000;
const maxPort = preferred + 50;

function isAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(true));
    });
  });
}

let port = preferred;
while (port <= maxPort) {
  // eslint-disable-next-line no-await-in-loop
  if (await isAvailable(port)) break;
  port += 1;
}

if (port > maxPort) {
  console.error(`[dev] No available port found in range ${preferred}-${maxPort}`);
  process.exit(1);
}

console.log(`[dev] Starting Next.js on port ${port}`);

const child = spawn("next", ["dev", "--port", String(port)], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT: String(port),
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
