import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  const { project_id } = await req.json();

  // Get currently signed-in user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Update completion status
  const { error } = await supabase
    .from('intern_projects')
    .update({ completed: true })
    .eq('intern_id', user.id)
    .eq('project_id', project_id);

  if (error) {
    return NextResponse.json({ error: 'Could not mark complete' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Marked complete ✅' });
}
