// ============================================================
// PM2 Ecosystem Configuration — Gumroad Clone
//
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 monit     # Monitor processes
//   pm2 logs      # View logs
//   pm2 reload ecosystem.config.js  # Zero-downtime restart
// ============================================================

module.exports = {
  apps: [
    {
      name: 'gumroad-api',
      script: 'server/dist/server.js',

      // Cluster mode — use all CPU cores
      instances: 'max',
      exec_mode: 'cluster',

      // Memory management
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Watch (disable in production)
      watch: false,

      // Logging
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Health check (PM2 Plus feature)
      // Uncomment if using PM2 Plus:
      // health_check: {
      //   url: 'http://localhost:5000/health',
      //   interval: 30000,
      //   timeout: 5000,
      // },
    },
  ],
};
