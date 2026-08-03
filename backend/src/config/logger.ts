import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'development' && process.env.PINO_PRETTY === 'true'
    ? {
        target: 'pino-pretty',
        options: { colorize: true },
      }
    : undefined,
});

export default logger;
