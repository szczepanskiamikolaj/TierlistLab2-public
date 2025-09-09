const handleError = (error: unknown, message?: string): Error => {
  if (error instanceof Error) {
    // Avoid duplicating messages if error.message already includes our custom message
    if (message && !error.message.includes(message)) {
      return new Error(`${message}: ${error.message}`);
    }
    return error;
  }
  return new Error(message || 'An unknown error occurred');
};



export { handleError };