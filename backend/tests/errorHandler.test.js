/**
 * Error Handler Tests
 */

const {
    AppError,
    ErrorCodes,
    createError
} = require('../middleware/errorHandler');

describe('Error Handler', () => {

    describe('AppError Class', () => {
        it('should create error with correct properties', () => {
            const error = new AppError('AUTH_REQUIRED');

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('AppError');
            expect(error.code).toBe(1001);
            expect(error.status).toBe(401);
            expect(error.message).toBe('Authentication required');
            expect(error.timestamp).toBeDefined();
        });

        it('should include details when provided', () => {
            const details = { field: 'email', issue: 'invalid format' };
            const error = new AppError('VALIDATION_ERROR', details);

            expect(error.details).toEqual(details);
        });

        it('should serialize to JSON correctly', () => {
            const error = new AppError('NOT_FOUND', { id: 123 });
            const json = error.toJSON();

            expect(json.error).toBe(true);
            expect(json.code).toBe(3001);
            expect(json.message).toBe('Resource not found');
            expect(json.details).toEqual({ id: 123 });
            expect(json.timestamp).toBeDefined();
        });

        it('should default to INTERNAL_ERROR for unknown types', () => {
            const error = new AppError('UNKNOWN_ERROR_TYPE');

            expect(error.code).toBe(5001);
            expect(error.status).toBe(500);
        });
    });

    describe('ErrorCodes', () => {
        it('should have authentication errors (1xxx)', () => {
            expect(ErrorCodes.AUTH_REQUIRED.code).toBe(1001);
            expect(ErrorCodes.AUTH_INVALID_TOKEN.code).toBe(1002);
            expect(ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS.code).toBe(1003);
        });

        it('should have validation errors (2xxx)', () => {
            expect(ErrorCodes.VALIDATION_ERROR.code).toBe(2001);
            expect(ErrorCodes.INVALID_INPUT.code).toBe(2002);
        });

        it('should have resource errors (3xxx)', () => {
            expect(ErrorCodes.NOT_FOUND.code).toBe(3001);
            expect(ErrorCodes.ALREADY_EXISTS.code).toBe(3002);
        });

        it('should have rate limiting errors (4xxx)', () => {
            expect(ErrorCodes.RATE_LIMITED.code).toBe(4001);
            expect(ErrorCodes.QUOTA_EXCEEDED.code).toBe(4002);
        });

        it('should have server errors (5xxx)', () => {
            expect(ErrorCodes.INTERNAL_ERROR.code).toBe(5001);
            expect(ErrorCodes.DATABASE_ERROR.code).toBe(5002);
            expect(ErrorCodes.EXTERNAL_SERVICE_ERROR.code).toBe(5003);
        });
    });

    describe('createError Helper', () => {
        it('should create AppError instances', () => {
            const error = createError('AUTH_REQUIRED');
            expect(error).toBeInstanceOf(AppError);
        });

        it('should pass through details and originalError', () => {
            const originalError = new Error('Original');
            const error = createError('DATABASE_ERROR', { query: 'SELECT...' }, originalError);

            expect(error.details).toEqual({ query: 'SELECT...' });
            expect(error.originalError).toBe(originalError);
        });
    });
});
