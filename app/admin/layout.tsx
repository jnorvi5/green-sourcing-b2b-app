import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNavigation from './AdminNavigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login');
  }

  // Check if user has appropriate role (admin, supplier, or architect)
  if (!['admin', 'supplier', 'architect'].includes(profile.role)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <AdminNavigation role={profile.role} profile={profile} />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
