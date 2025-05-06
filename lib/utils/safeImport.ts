/**
 * A utility function for safely importing modules dynamically with error handling
 * Helps prevent chunk loading errors from crashing the application
 */
export default async function safeImport<T>(
  importFn: () => Promise<T>,
  fallback?: T,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Dynamic import failed (attempt ${retries + 1}/${maxRetries}):`, error);

      // If this is a chunk loading error, wait a bit before retrying
      if (error instanceof Error && error.message.includes('Loading chunk')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      } else {
        // For other types of errors, don't retry
        break;
      }
    }
  }

  // If we've exhausted retries or it's not a chunk loading error
  console.error('Dynamic import ultimately failed after retries:', lastError);

  // Return fallback or throw the last error
  if (fallback !== undefined) {
    return fallback;
  }

  throw lastError;
}
