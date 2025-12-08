import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const supabase = await createClient();
  
  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = params;

  try {
    switch (type) {
      case 'sync-epds':
        await syncEPDData();
        break;
      case 'match-suppliers':
        await matchSuppliers();
        break;
      case 'send-notifications':
        await sendNotifications();
        break;
      case 'update-certifications':
        await updateCertifications();
        break;
      case 'generate-reports':
        await generateReports();
        break;
      default:
        return NextResponse.json({ error: 'Unknown automation type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${type} completed` });
  } catch (error) {
    console.error(`Automation error (${type}):`, error);
    return NextResponse.json({ error: 'Automation failed' }, { status: 500 });
  }
}

async function syncEPDData() {
  // Call backend service
  const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/data-providers/sync`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('EPD sync failed');
}

async function matchSuppliers() {
  const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/matchmaker/run`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Supplier matching failed');
}

async function sendNotifications() {
  const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/notifications/process`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Notification processing failed');
}

async function updateCertifications() {
  const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/certifier/verify-all`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Certification update failed');
}

async function generateReports() {
  const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/reports/generate`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Report generation failed');
}
