-- Create email_templates table
create table if not exists email_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  context text,
  recipient_role text,
  relationship text,
  goal text,
  tone text,
  length text,
  language text,
  additional_points text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create email_history table
create table if not exists email_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  input_data jsonb not null,
  generated_output jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table email_templates enable row level security;
alter table email_history enable row level security;

create policy "Users can view their own templates"
  on email_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own templates"
  on email_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on email_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on email_templates for delete
  using (auth.uid() = user_id);

create policy "Users can view their own history"
  on email_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own history"
  on email_history for insert
  with check (auth.uid() = user_id);
