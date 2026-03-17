-- Enabling UUID generation so that users can have unique identifiers for their pets and other entities in the database.

create extension if not exists "uuid-ossp";

-- All necessary TABLES

-- Users table also linked to Supabase Auth system, with a role field to differentiate between owners, vets, shelters, and admins.
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('owner', 'vet', 'shelter', 'admin')),
  phone text,
  location text,
  created_at timestamptz not null default now()
);

-- Pets table
create table if not exists pets (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  breed text not null,
  age integer not null default 0,
  gender text not null check (gender in ('Male', 'Female', 'Unknown')),
  photo_url text,
  medical_notes text,
  created_at timestamptz not null default now()
);

-- Vaccinations table
create table if not exists vaccinations (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references pets(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  date timestamptz not null,
  next_due_date timestamptz,
  vet_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- Appointments table
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references pets(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  vet_id uuid not null references users(id) on delete cascade,
  date timestamptz not null,
  reason text not null,
  status text not null check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Adoptions table
create table if not exists adoptions (
  id uuid primary key default uuid_generate_v4(),
  shelter_id uuid not null references users(id) on delete cascade,
  name text not null,
  breed text not null,
  age integer not null default 0,
  gender text not null check (gender in ('Male', 'Female', 'Unknown')),
  description text not null,
  photo_url text,
  status text not null check (status in ('available', 'pending', 'adopted')),
  created_at timestamptz not null default now()
);

-- Lost & Found animuls reports table
create table if not exists lost_found (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  pet_name text,
  description text not null,
  location text not null,
  date timestamptz not null,
  photo_url text,
  status text not null check (status in ('active', 'resolved')),
  created_at timestamptz not null default now()
);

-- Community posts table
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references users(id) on delete cascade,
  author_name text not null,
  content text not null,
  photo_url text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- INDEXES for faster queries on common fields and relationships. (Indexes on foreign keys and frequently queried fields like created_at for posts.)
create index if not exists idx_pets_owner_id on pets(owner_id);
create index if not exists idx_vaccinations_pet_id on vaccinations(pet_id);
create index if not exists idx_vaccinations_owner_id on vaccinations(owner_id);
create index if not exists idx_appointments_owner_id on appointments(owner_id);
create index if not exists idx_appointments_vet_id on appointments(vet_id);
create index if not exists idx_adoptions_shelter_id on adoptions(shelter_id);
create index if not exists idx_lost_found_reporter_id on lost_found(reporter_id);
create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_posts_created_at on posts(created_at desc);


-- RLS ROW LEVEL SECURITY (RLS) on all tables
alter table users enable row level security;
alter table pets enable row level security;
alter table vaccinations enable row level security;
alter table appointments enable row level security;
alter table adoptions enable row level security;
alter table lost_found enable row level security;
alter table posts enable row level security;

-- Helper: get current user's role so that we can use it in policies. (Because user-role checks are common across multiple tables, we define a helper function to avoid repeating the same logic in every policy.)
create or replace function get_user_role()
returns text as $$
  select role from users where id = auth.uid();
$$ language sql security definer stable;

-- USERS
create policy "Users: authenticated can read all" on users
  for select using (auth.uid() is not null);

create policy "Users: can insert own profile" on users
  for insert with check (auth.uid() = id);

create policy "Users: can update own profile" on users
  for update using (auth.uid() = id);

-- PETS
create policy "Pets: authenticated can read all" on pets
  for select using (auth.uid() is not null);

create policy "Pets: owners can insert own pets" on pets
  for insert with check (auth.uid() = owner_id);

create policy "Pets: owners can update own pets" on pets
  for update using (auth.uid() = owner_id);

create policy "Pets: owners can delete own pets" on pets
  for delete using (auth.uid() = owner_id);

-- VACCINATIONS
create policy "Vaccinations: authenticated can read all" on vaccinations
  for select using (auth.uid() is not null);

create policy "Vaccinations: owners/vets can insert" on vaccinations
  for insert with check (auth.uid() = owner_id or get_user_role() = 'vet');

create policy "Vaccinations: owners/vets can update" on vaccinations
  for update using (auth.uid() = owner_id or get_user_role() = 'vet');

create policy "Vaccinations: owners/vets can delete" on vaccinations
  for delete using (auth.uid() = owner_id or get_user_role() = 'vet');

-- APPOINTMENTS
create policy "Appointments: involved parties can read" on appointments
  for select using (auth.uid() = owner_id or auth.uid() = vet_id or get_user_role() = 'admin');

create policy "Appointments: owners can insert" on appointments
  for insert with check (auth.uid() = owner_id);

create policy "Appointments: involved parties can update" on appointments
  for update using (auth.uid() = owner_id or auth.uid() = vet_id or get_user_role() = 'admin');

create policy "Appointments: involved parties can delete" on appointments
  for delete using (auth.uid() = owner_id or auth.uid() = vet_id or get_user_role() = 'admin');

-- ADOPTIONS
create policy "Adoptions: public read" on adoptions
  for select using (true);

create policy "Adoptions: shelters can insert" on adoptions
  for insert with check (auth.uid() = shelter_id and get_user_role() = 'shelter');

create policy "Adoptions: shelters can update own" on adoptions
  for update using (auth.uid() = shelter_id or get_user_role() = 'admin');

create policy "Adoptions: shelters can delete own" on adoptions
  for delete using (auth.uid() = shelter_id or get_user_role() = 'admin');

--LOST & FOUND
create policy "Lost Found: public read" on lost_found
  for select using (true);

create policy "Lost Found: authenticated can insert" on lost_found
  for insert with check (auth.uid() = reporter_id);

create policy "Lost Found: authenticated can update" on lost_found
  for update using (auth.uid() is not null);

create policy "Lost Found: reporters can delete own" on lost_found
  for delete using (auth.uid() = reporter_id or get_user_role() = 'admin');

-- POSTS
create policy "Posts: public read" on posts
  for select using (true);

create policy "Posts: authenticated can insert" on posts
  for insert with check (auth.uid() = author_id);

create policy "Posts: authors can update own" on posts
  for update using (auth.uid() = author_id or get_user_role() = 'admin');

create policy "Posts: authors can delete own" on posts
  for delete using (auth.uid() = author_id or get_user_role() = 'admin');

-- ENABLE REALTIME (So that the frontend can subscribe to real-time updates for certain tables. This is particularly useful for live chat, notifications, and dynamic UI updates, Enabled it only for tables that need real-time updates, such as posts, pets, appointments, adoptions, and lost/found reports.)
alter publication supabase_realtime add table pets;
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table adoptions;
alter publication supabase_realtime add table lost_found;
alter publication supabase_realtime add table posts;

-- POST LIKES (tracks which user liked which post — prevents double-liking)
create table if not exists post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists idx_post_likes_post_id on post_likes(post_id);
create index if not exists idx_post_likes_user_id on post_likes(user_id);

alter table post_likes enable row level security;

create policy "Post Likes: authenticated can read all" on post_likes
  for select using (auth.uid() is not null);

create policy "Post Likes: users can insert own likes" on post_likes
  for insert with check (auth.uid() = user_id);

create policy "Post Likes: users can delete own likes" on post_likes
  for delete using (auth.uid() = user_id);

-- RPC: Atomically increment likes_count on a post
create or replace function increment_like(p_post_id uuid)
returns void as $$
begin
  update posts set likes_count = likes_count + 1 where id = p_post_id;
end;
$$ language plpgsql security definer;

-- RPC: Atomically decrement likes_count on a post
create or replace function decrement_like(p_post_id uuid)
returns void as $$
begin
  update posts set likes_count = greatest(likes_count - 1, 0) where id = p_post_id;
end;
$$ language plpgsql security definer;

alter publication supabase_realtime add table post_likes;
