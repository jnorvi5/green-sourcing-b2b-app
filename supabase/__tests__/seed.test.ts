
describe('seed script', () => {
  const mockQuery = jest.fn();
  const mockConnect = jest.fn();
  const mockEnd = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    mockQuery.mockClear();
    mockConnect.mockClear();
    mockEnd.mockClear();

    jest.doMock('pg', () => ({
      Client: jest.fn().mockImplementation(() => ({
        connect: mockConnect.mockResolvedValue(undefined),
        query: mockQuery,
        end: mockEnd.mockResolvedValue(undefined),
      })),
    }));
  });

  it('should run cleanup, seed data, and commit the transaction', async () => {
    const { seed } = require('../seed');
    const supplierId = 'some-uuid';
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // For BEGIN
      .mockResolvedValueOnce({ rows: [] }) // For TRUNCATE
      .mockResolvedValueOnce({ rows: [{ id: supplierId }] }) // For supplier insert
      .mockResolvedValue({ rows: [] }); // For product inserts and COMMIT

    await seed();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockQuery).toHaveBeenCalledWith('TRUNCATE TABLE products, suppliers CASCADE');
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO suppliers'), expect.any(Array));
    expect(mockQuery).toHaveBeenCalledTimes(24); // BEGIN, TRUNCATE, 1 supplier, 20 products, COMMIT
    expect(mockQuery).toHaveBeenCalledWith('COMMIT');
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should roll back the transaction if seeding fails', async () => {
    const { seed } = require('../seed');
    const dbError = new Error('test error');
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // For BEGIN
      .mockResolvedValueOnce({ rows: [] }) // For TRUNCATE
      .mockRejectedValueOnce(dbError); // Fail on supplier insert

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await seed();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockQuery).toHaveBeenCalledWith('TRUNCATE TABLE products, suppliers CASCADE');
    expect(mockQuery).toHaveBeenCalledTimes(4); // BEGIN, TRUNCATE, failed INSERT, and ROLLBACK
    expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding database:', dbError);
    expect(mockEnd).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
