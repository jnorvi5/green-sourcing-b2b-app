// PasswordChangeForm.tsx
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function mapSupabaseError(err: unknown) {
  if (!err) return null;
  const msg = err instanceof Error ? err.message : String(err);
  if (/leaked|pwned|compromis/i.test(msg)) {
    return 'This password has been found in a known data breach. Please choose a different, unique password.';
  }
  return msg;
}

export default function PasswordChangeForm() {
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    if (newPw.length < 8) return 'New password must be at least 8 characters.';
    if (newPw !== confirm) return 'New passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPw 
      });

      if (updateError) {
        setError(mapSupabaseError(updateError));
        return;
      }
      setSuccess('Password updated successfully.');
      setNewPw('');
      setConfirm('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">New password</label>
        <input 
          value={newPw} 
          onChange={e => setNewPw(e.target.value)} 
          type="password" 
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm new password</label>
        <input 
          value={confirm} 
          onChange={e => setConfirm(e.target.value)} 
          type="password" 
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Updating…' : 'Update password'}
      </button>

      <div className="text-xs text-gray-600">
        Choose a unique password not used on other sites. A password manager can help.
      </div>
    </form>
  );
}