-- ===============================================================================================
-- COMPLETE SCHEMA MIGRATION FIX - ENROLLMENT WORKFLOW + ROLE SWITCHING
-- Version: 2.0.0 (Complete Schema Synchronization)
-- ===============================================================================================

-- Fix 1: Create the missing 'enrollments' table that the RPC function expects
CREATE TABLE IF NOT EXISTS public.enrollments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES public.school_branches(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    grade TEXT NOT NULL,
    application_status TEXT DEFAULT 'ADMITTED' CHECK (application_status IN ('ADMITTED', 'REJECTED', 'PENDING')),
    enrollment_status TEXT DEFAULT 'FINALIZED' CHECK (enrollment_status IN ('FINALIZED', 'ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED')),
    class_id BIGINT REFERENCES public.school_classes(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    roll_number TEXT,
    student_id_number TEXT,
    parent_guardian_details TEXT,
    admission_id BIGINT REFERENCES public.admissions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add performance indexes for enrollments table
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_branch_id ON public.enrollments(branch_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_admission_id ON public.enrollments(admission_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(application_status, enrollment_status);

-- Fix 2: Ensure student_enrollments has branch_id for consistency
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES public.school_branches(id);

-- Populate existing records with correct branch_id from class relationship
UPDATE public.student_enrollments
SET branch_id = sc.branch_id
FROM public.school_classes sc
WHERE student_enrollments.class_id = sc.id AND student_enrollments.branch_id IS NULL;

-- Make branch_id NOT NULL after population
ALTER TABLE public.student_enrollments ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_branch_id ON public.student_enrollments(branch_id);

-- Fix 3: Create the admin_transition_admission RPC function
CREATE OR REPLACE FUNCTION public.admin_transition_admission(
    p_admission_id BIGINT,
    p_next_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admission_record RECORD;
    v_student_user_id UUID;
    v_enrollment_id BIGINT;
    v_result JSON;
BEGIN
    -- Validate input
    IF p_next_status NOT IN ('Approved', 'Rejected') THEN
        RETURN json_build_object('success', false, 'message', 'Invalid status transition');
    END IF;

    -- Get admission record
    SELECT * INTO v_admission_record
    FROM public.admissions
    WHERE id = p_admission_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Admission record not found');
    END IF;

    -- Update admission status
    UPDATE public.admissions
    SET status = p_next_status,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = p_admission_id;

    -- If approved, create enrollment record
    IF p_next_status = 'Approved' THEN
        v_student_user_id := v_admission_record.student_user_id;

        INSERT INTO public.enrollments (
            student_id,
            branch_id,
            academic_year,
            grade,
            application_status,
            enrollment_status,
            admission_id,
            enrollment_date
        )
        VALUES (
            v_student_user_id,
            v_admission_record.branch_id,
            EXTRACT(YEAR FROM now()) || '-' || (EXTRACT(YEAR FROM now()) + 1)::TEXT,
            v_admission_record.grade,
            'ADMITTED',
            'FINALIZED',
            p_admission_id,
            CURRENT_DATE
        )
        RETURNING id INTO v_enrollment_id;

        -- Update student profile
        UPDATE public.profiles
        SET role = 'student',
            profile_completed = true
        WHERE id = v_student_user_id;

        v_result := json_build_object(
            'success', true,
            'message', 'Student successfully admitted and enrolled',
            'enrollment_id', v_enrollment_id
        );
    ELSE
        v_result := json_build_object(
            'success', true,
            'message', 'Admission status updated to ' || p_next_status
        );
    END IF;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
END;
$$;

-- Fix 4: Function to switch active role
DROP FUNCTION IF EXISTS public.switch_active_role(TEXT);
CREATE OR REPLACE FUNCTION public.switch_active_role(p_target_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_role TEXT;
    v_profile_restored BOOLEAN := false;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get current role
    SELECT role INTO v_current_role
    FROM profiles
    WHERE id = v_user_id;

    -- Update the role
    UPDATE profiles
    SET role = p_target_role,
        updated_at = now()
    WHERE id = v_user_id;

    -- Check if this is restoring an existing profile
    IF v_current_role IS NOT NULL AND v_current_role != p_target_role THEN
        v_profile_restored := true;
    END IF;

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'profile_restored', v_profile_restored,
        'target_role', p_target_role
    );
END;
$$;

-- Fix 5: Update get_all_students_for_admin function to use enrollments table
CREATE OR REPLACE FUNCTION public.get_all_students_for_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    phone TEXT,
    role user_role,
    profile_completed BOOLEAN,
    is_active BOOLEAN,
    branch_id BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    enrollment_id BIGINT,
    academic_year TEXT,
    grade TEXT,
    application_status TEXT,
    enrollment_status TEXT,
    class_id BIGINT,
    enrollment_date DATE,
    roll_number TEXT,
    student_id_number TEXT,
    parent_guardian_details TEXT,
    admission_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.display_name,
        p.phone,
        p.role,
        p.profile_completed,
        p.is_active,
        p.branch_id,
        p.created_at,
        p.updated_at,
        e.id as enrollment_id,
        e.academic_year,
        e.grade,
        e.application_status,
        e.enrollment_status,
        e.class_id,
        e.enrollment_date,
        e.roll_number,
        e.student_id_number,
        e.parent_guardian_details,
        e.admission_id
    FROM public.profiles p
    LEFT JOIN public.enrollments e ON p.id = e.student_id
    WHERE p.role = 'student'
    AND p.is_active = true
    AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_transition_admission(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_active_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_students_for_admin() TO authenticated;

-- Enable RLS on enrollments table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enrollments table
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments
    FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Students can view their enrollments" ON public.enrollments;
CREATE POLICY "Students can view their enrollments" ON public.enrollments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view their children's enrollments" ON public.enrollments;
CREATE POLICY "Parents can view their children's enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'parent'
            AND enrollments.parent_guardian_details ILIKE '%' || p.display_name || '%'
        )
    );

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
