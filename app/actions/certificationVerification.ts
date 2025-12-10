'use server';

/**
 * Server Actions for Admin Certification Verification
 * All functions include admin role checks and proper error handling
 */

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { certificationVerifiedEmail, certificationRejectedEmail } from '@/lib/email/certificationTemplates';
import type {
  CertificationPendingSupplier,
  VerificationStats,
  CertificationActionResult,
  VerifyInput,
  RejectInput,
} from '@/types/certification-verification';

const resend = new Resend(process.env['RESEND_API_KEY']);

/**
 * Check if the current user is an admin
 */
async function checkAdminRole(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { isAdmin: false, userId: null };
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    return { isAdmin: false, userId: user.id };
  }
  
  return { isAdmin: userData.role === 'admin', userId: user.id };
}

/**
 * Fetch all suppliers with pending certifications
 */
export async function fetchPendingCertifications(): Promise<{
  data: CertificationPendingSupplier[] | null;
  error: string | null;
}> {
  try {
    const { isAdmin } = await checkAdminRole();
    
    if (!isAdmin) {
      return { data: null, error: 'Unauthorized: Admin access required' };
    }
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        id,
        company_name,
        cert_type,
        cert_pdf_url,
        cert_uploaded_at,
        cert_verified,
        cert_verification_date,
        cert_rejection_reason,
        user_id,
        users (
          email,
          full_name
        )
      `)
      .not('cert_pdf_url', 'is', null)
      .order('cert_uploaded_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending certifications:', error);
      return { data: null, error: error.message };
    }
    
    return { data: data as CertificationPendingSupplier[], error: null };

  } catch (err) {
    console.error('Unexpected error in fetchPendingCertifications:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}

/**
 * Fetch verification statistics
 */
export async function fetchVerificationStats(): Promise<{
  data: VerificationStats | null;
  error: string | null;
}> {
  try {
    const { isAdmin } = await checkAdminRole();
    
    if (!isAdmin) {
      return { data: null, error: 'Unauthorized: Admin access required' };
    }
    
    const supabase = await createClient();
    
    // Get total pending (not verified and has cert_pdf_url)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .not('cert_pdf_url', 'is', null)
      .eq('cert_verified', false)
      .is('cert_rejection_reason', null);
    
    if (pendingError) {
      console.error('Error fetching pending count:', pendingError);
      return { data: null, error: pendingError.message };
    }
    
    // Get verified today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    const { count: verifiedTodayCount, error: verifiedError } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('cert_verified', true)
      .gte('cert_verification_date', todayISO);
    
    if (verifiedError) {
      console.error('Error fetching verified today count:', verifiedError);
      return { data: null, error: verifiedError.message };
    }
    
    // Get rejected today
    const { count: rejectedTodayCount, error: rejectedError } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .not('cert_rejection_reason', 'is', null)
      .gte('cert_verification_date', todayISO);
    
    if (rejectedError) {
      console.error('Error fetching rejected today count:', rejectedError);
      return { data: null, error: rejectedError.message };
    }
    
    return {
      data: {
        totalPending: pendingCount || 0,
        verifiedToday: verifiedTodayCount || 0,
        rejectedToday: rejectedTodayCount || 0,
      },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in fetchVerificationStats:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}

/**
 * Verify a supplier's certification
 */
export async function verifyCertification(
  input: VerifyInput
): Promise<CertificationActionResult> {
  try {
    const { isAdmin } = await checkAdminRole();
    
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    const supabase = await createClient();
    
    // Get supplier details before update
    const { data: supplier, error: fetchError } = await supabase
      .from('suppliers')
      .select(`
        id,
        company_name,
        cert_type,
        user_id,
        users (
          email,
          full_name
        )
      `)
      .eq('id', input.supplierId)
      .single();
    
    if (fetchError || !supplier) {
      return { success: false, error: 'Supplier not found' };
    }
    
    // Update certification status
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        cert_verified: true,
        cert_verification_date: new Date().toISOString(),
        cert_rejection_reason: null, // Clear any previous rejection reason
      })
      .eq('id', input.supplierId);
    
    if (updateError) {
      console.error('Error updating certification status:', updateError);
      return { success: false, error: updateError.message };
    }
    
    // Send verification email
    if (supplier.users && supplier.users.email) {
      try {
        const emailHtml = certificationVerifiedEmail(
          supplier.users.full_name || 'Supplier',
          supplier.company_name,
          supplier.cert_type || 'Certification'
        );
        
        // Only send email if RESEND_API_KEY is configured
        if (process.env['RESEND_API_KEY']) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@greenchainz.com',
            to: supplier.users.email,
            subject: 'Your certification has been verified!',
            html: emailHtml,
          });
        } else {
          console.log('[DEV] Verification email would be sent to:', supplier.users.email);
        }
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail the operation if email fails
      }
    }
    
    return { 
      success: true, 
      message: `Certification verified for ${supplier.company_name}` 
    };
  } catch (err) {
    console.error('Unexpected error in verifyCertification:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}

/**
 * Reject a supplier's certification
 */
export async function rejectCertification(
  input: RejectInput
): Promise<CertificationActionResult> {
  try {
    const { isAdmin } = await checkAdminRole();
    
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, error: 'Rejection reason is required' };
    }
    
    const supabase = await createClient();
    
    // Get supplier details before update
    const { data: supplier, error: fetchError } = await supabase
      .from('suppliers')
      .select(`
        id,
        company_name,
        cert_type,
        user_id,
        users (
          email,
          full_name
        )
      `)
      .eq('id', input.supplierId)
      .single();
    
    if (fetchError || !supplier) {
      return { success: false, error: 'Supplier not found' };
    }
    
    // Update certification status - set cert_pdf_url to null and add rejection reason
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        cert_pdf_url: null,
        cert_verified: false,
        cert_verification_date: new Date().toISOString(),
        cert_rejection_reason: input.reason,
      })
      .eq('id', input.supplierId);
    
    if (updateError) {
      console.error('Error updating certification status:', updateError);
      return { success: false, error: updateError.message };
    }
    
    // Send rejection email
    if (supplier.users && supplier.users.email) {
      try {
        const emailHtml = certificationRejectedEmail(
          supplier.users.full_name || 'Supplier',
          supplier.company_name,
          supplier.cert_type || 'Certification',
          input.reason
        );
        
        // Only send email if RESEND_API_KEY is configured
        if (process.env['RESEND_API_KEY']) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@greenchainz.com',
            to: supplier.users.email,
            subject: 'Please re-upload your certification',
            html: emailHtml,
          });
        } else {
          console.log('[DEV] Rejection email would be sent to:', supplier.users.email);
        }
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Don't fail the operation if email fails
      }
    }
    
    return { 
      success: true, 
      message: `Certification rejected for ${supplier.company_name}` 
    };
  } catch (err) {
    console.error('Unexpected error in rejectCertification:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}
