/**
 * Tests for Certification Email Templates
 * Ensures HTML escaping, correct structure, and proper content
 */

import { certificationVerifiedEmail, certificationRejectedEmail } from '../templates/certification';

describe('certificationVerifiedEmail', () => {
  it('should generate a valid HTML email for verified certification', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC'
    );

    expect(email).toContain('<!DOCTYPE html>');
    expect(email).toContain('Certification Verified!');
    expect(email).toContain('John Doe');
    expect(email).toContain('Green Materials Co');
    expect(email).toContain('FSC');
    expect(email).toContain('Verified ✓');
  });

  it('should escape HTML in supplier name', () => {
    const email = certificationVerifiedEmail(
      '<script>alert("xss")</script>',
      'Green Materials Co',
      'FSC'
    );

    expect(email).not.toContain('<script>');
    expect(email).toContain('&lt;script&gt;');
  });

  it('should escape HTML in company name', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      '<img src=x onerror=alert(1)>',
      'FSC'
    );

    expect(email).not.toContain('<img src=');
    expect(email).toContain('&lt;img');
  });

  it('should escape HTML in cert type', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      'Green Materials Co',
      '<b>Fake Cert</b>'
    );

    expect(email).not.toContain('<b>Fake Cert</b>');
    expect(email).toContain('&lt;b&gt;Fake Cert&lt;/b&gt;');
  });

  it('should include a CTA link to supplier dashboard', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC'
    );

    expect(email).toContain('View Your Dashboard');
    expect(email).toContain('/supplier/dashboard');
  });

  it('should include teal brand color', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC'
    );

    expect(email).toContain('#14b8a6');
  });

  it('should include footer with year and links', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC'
    );

    const currentYear = new Date().getFullYear();
    expect(email).toContain(currentYear.toString());
    expect(email).toContain('Terms');
    expect(email).toContain('Privacy');
  });
});

describe('certificationRejectedEmail', () => {
  it('should generate a valid HTML email for rejected certification', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      'The certification document is expired'
    );

    expect(email).toContain('<!DOCTYPE html>');
    expect(email).toContain('Certification Review Required');
    expect(email).toContain('John Doe');
    expect(email).toContain('Green Materials Co');
    expect(email).toContain('FSC');
    expect(email).toContain('The certification document is expired');
  });

  it('should escape HTML in supplier name', () => {
    const email = certificationRejectedEmail(
      '<svg onload=alert(1)>',
      'Green Materials Co',
      'FSC',
      'Document issue'
    );

    expect(email).not.toContain('<svg onload=');
    expect(email).toContain('&lt;svg');
  });

  it('should escape HTML in company name', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      '"><script>alert(1)</script>',
      'FSC',
      'Document issue'
    );

    expect(email).not.toContain('<script>');
    expect(email).toContain('&lt;script&gt;');
  });

  it('should escape HTML in cert type', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      '<iframe src="evil.com"></iframe>',
      'Document issue'
    );

    expect(email).not.toContain('<iframe');
    expect(email).toContain('&lt;iframe');
  });

  it('should escape HTML in rejection reason', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      '<a href="phishing.com">Click here</a>'
    );

    expect(email).not.toContain('<a href="phishing.com">');
    expect(email).toContain('&lt;a href=');
  });

  it('should include admin notes section', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      'The document is blurry and unreadable'
    );

    expect(email).toContain('Admin Notes:');
    expect(email).toContain('The document is blurry and unreadable');
  });

  it('should include next steps section', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      'Document issue'
    );

    expect(email).toContain('Next Steps:');
    expect(email).toContain('Review the admin notes');
    expect(email).toContain('Upload the new certification');
  });

  it('should include a CTA link to re-upload', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      'Document issue'
    );

    expect(email).toContain('Re-upload Certification');
    expect(email).toContain('/supplier/dashboard');
  });

  it('should include teal brand color', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      'Document issue'
    );

    expect(email).toContain('#14b8a6');
  });

  it('should include footer with year and links', () => {
    const email = certificationRejectedEmail(
      'John Doe',
      'Green Materials Co',
      'FSC',
      'Document issue'
    );

    const currentYear = new Date().getFullYear();
    expect(email).toContain(currentYear.toString());
    expect(email).toContain('Terms');
    expect(email).toContain('Privacy');
  });
});

describe('HTML escaping edge cases', () => {
  it('should handle apostrophes and quotes', () => {
    const email = certificationVerifiedEmail(
      "John O'Brien",
      'Green "Certified" Materials',
      'FSC'
    );

    expect(email).toContain("John O&#039;Brien");
    expect(email).toContain('Green &quot;Certified&quot; Materials');
  });

  it('should handle ampersands', () => {
    const email = certificationVerifiedEmail(
      'John Doe',
      'Smith & Co',
      'FSC'
    );

    expect(email).toContain('Smith &amp; Co');
  });

  it('should handle multiple special characters', () => {
    const email = certificationVerifiedEmail(
      'John <Doe>',
      'Smith & "Jones"',
      'ISO 14001'
    );

    expect(email).toContain('John &lt;Doe&gt;');
    expect(email).toContain('Smith &amp; &quot;Jones&quot;');
  });
});
