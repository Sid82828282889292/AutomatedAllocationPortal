import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
  try {
    // Fetch projects that are not yet assigned
    const { data: unassignedProjects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .is('assigned', null);

    if (projectError || !unassignedProjects) {
      return NextResponse.json({ error: 'Failed to fetch unassigned projects.' }, { status: 500 });
    }

    // Fetch all interns
    const { data: interns, error: internError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'intern');

    if (internError || !interns) {
      return NextResponse.json({ error: 'Failed to fetch interns.' }, { status: 500 });
    }

    for (const project of unassignedProjects) {
      const { data: projectSkills } = await supabase
        .from('project_skills')
        .select('*')
        .eq('project_id', project.id);

      if (!projectSkills) continue;

      // Score interns based on matching skill ratings
      let bestMatch = null;
      let bestScore = -1;

      for (const intern of interns) {
        const { data: ratings } = await supabase
          .from('intern_skills')
          .select('*')
          .eq('intern_id', intern.id);

        if (!ratings) continue;

        let score = 0;
        for (const ps of projectSkills) {
          const skillRating = ratings.find((r) => r.skill_id === ps.skill_id)?.rating || 0;
          score += skillRating;
        }

        if (score > bestScore && intern.goal_hours && intern.goal_hours >= project.estimated_hours) {
          bestScore = score;
          bestMatch = intern;
        }
      }

      if (bestMatch) {
        // Assign project to best-matching intern
        await supabase.from('intern_projects').insert({
          intern_id: bestMatch.id,
          project_id: project.id,
          completed: false,
        });

        // Optionally mark as assigned
        await supabase
          .from('projects')
          .update({ assigned: true })
          .eq('id', project.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Auto allocation error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
