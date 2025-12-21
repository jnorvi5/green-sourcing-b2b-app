import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    // Redirect non-admins to their respective dashboards or home
    if (profile?.role === 'supplier') return redirect('/supplier/dashboard');
    if (profile?.role === 'architect') return redirect('/architect/dashboard');
    return redirect('/');
  }

  return <AdminDashboard />;
}
