const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Explicitly set development mode
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const dev = process.env.NODE_ENV !== 'production';

// Add extensive debug logging
console.log(`Starting server in ${dev ? 'development' : 'production'} mode`);
console.log('Node.js version:', process.version);
console.log('Process arguments:', process.argv);
console.log('Working directory:', process.cwd());

// Add progress markers
console.log('[1] Initializing Next.js app');
const app = next({ dev });
console.log('[2] Getting request handler');
const handle = app.getRequestHandler();

// Add preparation timeout detection
const prepTimeout = setTimeout(() => {
  console.error('WARNING: Next.js app preparation has been running for 30 seconds without completing');
  console.error('This might indicate a configuration issue or resource limitation');
}, 30000);

console.log('[3] Preparing Next.js app');
app.prepare()
  .then(() => {
    clearTimeout(prepTimeout);
    console.log('[4] Next.js app prepared successfully');

    console.log('[5] Creating HTTP server');
    const server = createServer((req, res) => {
      const requestStart = Date.now();
      console.log(`Request received at ${new Date().toISOString()}: ${req.method} ${req.url}`);
      
      // Add request timeout detection
      const requestTimeout = setTimeout(() => {
        console.error(`WARNING: Request ${req.method} ${req.url} has been processing for 10 seconds`);
      }, 10000);
      
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Create finished handler to log completion
      const originalEnd = res.end;
      res.end = function() {
        clearTimeout(requestTimeout);
        const duration = Date.now() - requestStart;
        console.log(`Request completed in ${duration}ms: ${req.method} ${req.url} with status ${res.statusCode}`);
        return originalEnd.apply(this, arguments);
      };
      
      // Let Next.js handle the request
      console.log(`[6] Handling request for ${parsedUrl.pathname}`);
      handle(req, res, parsedUrl);
    });

    console.log('[7] Starting HTTP server');
    server.listen(3000, 'localhost', (err) => { // Listen on localhost instead of 0.0.0.0
      if (err) throw err;
      console.log('[8] Server listening on http://localhost:3000');
    });
  })
  .catch(err => {
    clearTimeout(prepTimeout);
    console.error('Error preparing Next.js app:');
    console.error(err);
    process.exit(1);
  });

// Add global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
