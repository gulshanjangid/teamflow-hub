
-- Enums
CREATE TYPE public.project_role AS ENUM ('admin', 'member');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Project members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.project_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_admin(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_project_with(_other_user UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = _user_id AND pm2.user_id = _other_user
  );
$$;

-- Auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto add creator as admin member
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- updated_at trigger for tasks
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== RLS Policies =====

-- Profiles: see own + teammates'; update own
CREATE POLICY "View own profile" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "View teammate profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.shares_project_with(id, auth.uid()));
CREATE POLICY "Update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid());

-- Projects
CREATE POLICY "Members view project" ON public.projects
FOR SELECT TO authenticated USING (public.is_project_member(id, auth.uid()));
CREATE POLICY "Authenticated create project" ON public.projects
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins update project" ON public.projects
FOR UPDATE TO authenticated USING (public.is_project_admin(id, auth.uid()));
CREATE POLICY "Admins delete project" ON public.projects
FOR DELETE TO authenticated USING (public.is_project_admin(id, auth.uid()));

-- Project members
CREATE POLICY "Members view membership" ON public.project_members
FOR SELECT TO authenticated USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Admins add members" ON public.project_members
FOR INSERT TO authenticated WITH CHECK (
  public.is_project_admin(project_id, auth.uid())
  OR (
    -- allow trigger-driven self-insert for project creator
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()
    )
  )
);
CREATE POLICY "Admins update members" ON public.project_members
FOR UPDATE TO authenticated USING (public.is_project_admin(project_id, auth.uid()));
CREATE POLICY "Admins remove members" ON public.project_members
FOR DELETE TO authenticated USING (public.is_project_admin(project_id, auth.uid()));

-- Tasks
CREATE POLICY "Members view tasks" ON public.tasks
FOR SELECT TO authenticated USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members create tasks" ON public.tasks
FOR INSERT TO authenticated WITH CHECK (
  public.is_project_member(project_id, auth.uid()) AND created_by = auth.uid()
);
CREATE POLICY "Admin or owner update tasks" ON public.tasks
FOR UPDATE TO authenticated USING (
  public.is_project_admin(project_id, auth.uid())
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
);
CREATE POLICY "Admin or creator delete tasks" ON public.tasks
FOR DELETE TO authenticated USING (
  public.is_project_admin(project_id, auth.uid())
  OR created_by = auth.uid()
);
