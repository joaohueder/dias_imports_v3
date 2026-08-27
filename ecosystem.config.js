module.exports = {
  apps: [
    {
      name: "jh7-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "jh7-worker-daemon",
      script: "scripts/worker-daemon.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      },
    },
  ],
};
