const Sentry = require('@sentry/node');

const initializeSentry = () => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    const ignoredPatterns = [
      'DeprecationWarning',
      'Warning: Accessing',
      'NOTE: The AWS SDK',
      '[DEP0111]',
      'node:20844'
    ];
    
    const shouldReport = !ignoredPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );

    if (shouldReport) {
      Sentry.withScope(scope => {
        scope.setTag('type', 'console_error');
        scope.setExtra('error_details', args);
        
        if (args[0] instanceof Error) {
          Sentry.captureException(args[0]);
        } else {
          Sentry.captureMessage(errorMessage);
        }
      });
    }
    
    originalConsoleError.apply(console, args);
  };

  Sentry.init({
    dsn: process.env.DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.RELEASE_VERSION || '1.0.0',
    tracesSampleRate: 1.0,
    autoSessionTracking: true,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true })
    ]
  });

  return {
    createTransaction: (name, op = 'custom') => {
      const transaction = Sentry.startTransaction({
        op,
        name,
        sampled: true
      });
      Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
      return transaction;
    },

    captureException: Sentry.captureException,
    withScope: Sentry.withScope
  };
};

module.exports = initializeSentry;