import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname, override: true });

const [{ default: app }, { default: connectDB }] = await Promise.all([
  import('./app.js'),
  import('./config/db.js'),
]);

const primaryPort = Number(process.env.PORT || 5000);
const fallbackPort = 5001;
const allowFallbackPort = process.env.NODE_ENV !== 'production';

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Pathora API running on port ${port}`);
  });

  server.on('error', (error) => {
    if (allowFallbackPort && error.code === 'EADDRINUSE' && port === primaryPort) {
      console.warn(`Port ${primaryPort} is unavailable. Falling back to port ${fallbackPort}.`);
      server.close(() => startServer(fallbackPort));
      return;
    }

    throw error;
  });
};

connectDB();
startServer(primaryPort);
