declare module 'pg';
declare module 'p-retry' {
  function pRetry<T>(fn: () => Promise<T>, options?: {
    retries?: number;
    minTimeout?: number;
    factor?: number;
    onFailedAttempt?: (error: { code?: number }) => void;
  }): Promise<T>;
  export default pRetry;
}

