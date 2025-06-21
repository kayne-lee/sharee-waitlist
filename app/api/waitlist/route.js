import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function POST(req) {
  const body = await req.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const { data: existingUser } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('waitlist')
    .insert([
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
  }

  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    success: true,
    message: 'Successfully joined waitlist',
    data: {
      id: data.id,
      name: data.name,
      position: count || 1
    }
  }, { status: 201 });
}
