/**
 * Security Middleware Tests
 */

const {
    validate,
    validations,
    sanitizeRequest
} = require('../middleware/security');

describe('Security Middleware', () => {

    describe('Input Sanitization', () => {
        it('should remove null bytes from strings', () => {
            const req = {
                body: { name: 'test\0injection', email: 'test@example.com' },
                query: { search: 'query\0attack' },
                params: { id: '123\0' }
            };
            const res = {};
            const next = jest.fn();

            sanitizeRequest(req, res, next);

            expect(req.body.name).toBe('testinjection');
            expect(req.query.search).toBe('queryattack');
            expect(req.params.id).toBe('123');
            expect(next).toHaveBeenCalled();
        });

        it('should handle nested objects', () => {
            const req = {
                body: {
                    user: {
                        name: 'test\0',
                        address: { city: 'NYC\0' }
                    }
                },
                query: {},
                params: {}
            };
            const res = {};
            const next = jest.fn();

            sanitizeRequest(req, res, next);

            expect(req.body.user.name).toBe('test');
            expect(req.body.user.address.city).toBe('NYC');
        });

        it('should not modify non-string values', () => {
            const req = {
                body: { count: 5, active: true, items: [1, 2, 3] },
                query: {},
                params: {}
            };
            const res = {};
            const next = jest.fn();

            sanitizeRequest(req, res, next);

            expect(req.body.count).toBe(5);
            expect(req.body.active).toBe(true);
            expect(req.body.items).toEqual([1, 2, 3]);
        });
    });

    describe('Validation Chains', () => {
        it('should have email validation', () => {
            expect(validations.email).toBeDefined();
        });

        it('should have password validation', () => {
            expect(validations.password).toBeDefined();
        });

        it('should have pagination validation', () => {
            expect(validations.pagination).toBeDefined();
            expect(Array.isArray(validations.pagination)).toBe(true);
        });
    });
});
