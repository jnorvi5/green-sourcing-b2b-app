import { calculateGreenScore } from '../scoring';

describe('calculateGreenScore', () => {

  // Case A (High Performer): Low GWP, 80% recycled, Platinum cert. Should return high score.
  test('should return a high score for a high-performing product', () => {
    const input = {
      gwp: 5.0,
      recycledContent: 80,
      certification: 'Platinum',
    };
    // 80% recycled content = +8 points
    // Platinum certification = +30 points
    // GWP is not > 10.0, so no penalty.
    // Expected score = 8 + 30 = 38
    expect(calculateGreenScore(input)).toBe(38);
  });

  // Case B (Penalty): High GWP (>10), 0% recycled, no cert. Should return 0 (handle negative clamp).
  test('should return 0 when the score is negative due to penalties', () => {
    const input = {
      gwp: 15.0,
      recycledContent: 0,
      certification: 'None',
    };
    // 0% recycled content = +0 points
    // 'None' certification = +0 points
    // GWP > 10.0 = -5 points
    // Expected score = 0 + 0 - 5 = -5, which should be clamped to 0.
    expect(calculateGreenScore(input)).toBe(0);
  });

  // Case C (Edge): Exactly 10.0 GWP (boundary check).
  test('should not apply a GWP penalty for a GWP of exactly 10.0', () => {
    const input = {
      gwp: 10.0,
      recycledContent: 50,
      certification: 'Silver',
    };
    // 50% recycled content = +5 points
    // Silver certification = +10 points
    // GWP is not > 10.0, so no penalty.
    // Expected score = 5 + 10 = 15
    expect(calculateGreenScore(input)).toBe(15);
  });

  // Test case for the highest possible score according to the spec
  test('should calculate the highest possible score correctly', () => {
    const veryHighPerformer = {
      gwp: 0,
      recycledContent: 100, // +10 points
      certification: 'Platinum', // +30 points
    };
    // Expected score = 10 + 30 = 40
    expect(calculateGreenScore(veryHighPerformer)).toBe(40);
  });
});
