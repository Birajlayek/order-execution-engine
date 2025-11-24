export const CONSTANTS = {
  MAX_CONCURRENT_ORDERS: parseInt(process.env.MAX_CONCURRENT_ORDERS || '10'),
  RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '2000'),
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: parseInt(process.env.FAILURE_THRESHOLD || '5'),
    RECOVERY_TIMEOUT: parseInt(process.env.RECOVERY_TIMEOUT || '60000'),
  },
};
