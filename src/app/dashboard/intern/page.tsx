'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InternDashboard() {
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [goalHours, setGoalHours] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: skillsData } = await supabase.from('skills').select('*');
      if (skillsData) setSkills(skillsData);

      const { data: projectData } = await supabase
        .from('intern_projects')
        .select('*, projects(*)')
        .eq('intern_id', user.id);

      if (projectData) setProjects(projectData);

      const { data: completedData } = await supabase
        .from('completed_projects')
        .select('*, projects(*)')
        .eq('intern_id', user.id);

      if (completedData) setCompletedProjects(completedData);
    }

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!userId) return;

    const skillsToInsert = Object.entries(ratings).map(([skillId, rating]) => ({
      intern_id: userId,
      skill_id: skillId,
      rating: Number(rating),
    }));

    const { error: skillsError } = await supabase.from('intern_skills').upsert(skillsToInsert);

    if (skillsError) {
      setMessage('❌ Failed to save skills.');
      return;
    }

    const { error: goalError } = await supabase
      .from('users')
      .update({ goal_hours: Number(goalHours) })
      .eq('id', userId);

    if (goalError) {
      setMessage('❌ Failed to save goal hours.');
      return;
    }

    setMessage('✅ Saved successfully!');
  };

  const handleComplete = async (projectId: string) => {
    if (!userId) return;

    const { error: insertError } = await supabase.from('completed_projects').insert({
      intern_id: userId,
      project_id: projectId,
    });

    if (insertError) {
      console.error('Insert Error:', insertError.message);
      setMessage('❌ Could not complete project.');
      return;
    }

    const { error: deleteError } = await supabase
      .from('intern_projects')
      .delete()
      .match({ intern_id: userId, project_id: projectId });

    if (deleteError) {
      console.error('Delete Error:', deleteError.message);
      setMessage('❌ Failed to remove project from active list.');
      return;
    }

    setMessage('✅ Project marked as complete!');
    setProjects((prev) => prev.filter((p) => p.project_id !== projectId));

    // Optional: Refresh completed projects
    const { data: completedData } = await supabase
      .from('completed_projects')
      .select('*, projects(*)')
      .eq('intern_id', userId);
    if (completedData) setCompletedProjects(completedData);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Intern Dashboard</h1>

      <div className="mb-6">
        <label className="block font-medium mb-2">Monthly Goal (in hours):</label>
        <input
          type="number"
          value={goalHours}
          onChange={(e) => setGoalHours(e.target.value)}
          className="p-2 border border-gray-300 rounded w-64"
          placeholder="Enter monthly hour goal"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Rate Your Skills</h2>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-4">
              <label className="w-40">{skill.name}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={ratings[skill.id] || 3}
                onChange={(e) =>
                  setRatings({ ...ratings, [skill.id]: Number(e.target.value) })
                }
              />
              <span>{ratings[skill.id] || 3}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Save
      </button>

      {message && <p className="mt-4 text-blue-600 font-medium">{message}</p>}

      {projects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">🧠 Your Assigned Projects</h2>
          <div className="space-y-4">
            {projects.map((p) => (
              <div
                key={p.project_id}
                className="border border-gray-300 p-4 rounded shadow bg-white"
              >
                <h3 className="text-lg font-bold">{p.projects.name}</h3>
                <p className="text-gray-700">{p.projects.description}</p>
                <p className="text-sm text-gray-500">
                  Estimated Hours: {p.projects.estimated_hours}
                </p>
                <button
                  onClick={() => handleComplete(p.project_id)}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mark as Complete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedProjects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">✅ Completed Projects</h2>
          <div className="space-y-4">
            {completedProjects.map((p) => (
              <div
                key={p.project_id}
                className="border border-green-300 p-4 rounded shadow bg-green-50"
              >
                <h3 className="text-lg font-bold">{p.projects.name}</h3>
                <p>{p.projects.description}</p>
                <p className="text-sm text-gray-500">
                  Completed at: {new Date(p.completed_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
