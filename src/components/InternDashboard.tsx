'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { CheckCircle, Rocket } from 'lucide-react';
import { Button } from './ui/button';

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
    if (skillsError) return setMessage('❌ Failed to save skills.');

    const { error: goalError } = await supabase
      .from('users')
      .update({ goal_hours: Number(goalHours) })
      .eq('id', userId);
    if (goalError) return setMessage('❌ Failed to save goal hours.');

    setMessage('✅ Saved successfully!');
  };

  const handleComplete = async (projectId: string) => {
    if (!userId) return;

    const { error: insertError } = await supabase.from('completed_projects').insert({
      intern_id: userId,
      project_id: projectId,
    });
    if (insertError) return setMessage('❌ Could not complete project.');

    const { error: deleteError } = await supabase
      .from('intern_projects')
      .delete()
      .match({ intern_id: userId, project_id: projectId });
    if (deleteError) return setMessage('❌ Failed to remove project from active list.');

    setMessage('✅ Project marked as complete!');
    setProjects((prev) => prev.filter((p) => p.project_id !== projectId));

    const { data: completedData } = await supabase
      .from('completed_projects')
      .select('*, projects(*)')
      .eq('intern_id', userId);
    if (completedData) setCompletedProjects(completedData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-800 dark:text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Intern Dashboard
      </motion.h1>

      {/* Monthly Goal Input */}
      <section className="mb-10">
        <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">
          Monthly Goal (in hours):
        </label>
        <input
          type="number"
          value={goalHours}
          onChange={(e) => setGoalHours(e.target.value)}
          placeholder="e.g. 20"
          className="w-60 p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
      </section>

      {/* Skill Ratings */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Rate Your Skills
        </h2>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-4">
              <label className="w-40 text-gray-700 dark:text-gray-300">{skill.name}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={ratings[skill.id] || 3}
                onChange={(e) =>
                  setRatings({ ...ratings, [skill.id]: Number(e.target.value) })
                }
              />
              <span className="text-gray-600 dark:text-white">{ratings[skill.id] || 3}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <Button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Save
      </Button>

      {/* Message Banner */}
      {message && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-white dark:bg-gray-800 shadow rounded border text-gray-800 dark:text-white">
          {message}
        </div>
      )}

      {/* Assigned Projects */}
      {projects.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            🧠 Your Assigned Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((p) => (
              <motion.div
                key={p.project_id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow hover:shadow-lg transition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                  {p.projects.name}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{p.projects.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Estimated Hours: {p.projects.estimated_hours}
                </p>
                <button
                  onClick={() => handleComplete(p.project_id)}
                  className="mt-3 inline-flex items-center px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark as Complete
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            ✅ Completed Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {completedProjects.map((p) => (
              <motion.div
                key={p.project_id}
                className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600 p-5 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                  {p.projects.name}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{p.projects.description}</p>
                <p className="text-xs mt-2 text-gray-500">
                  Completed At: {new Date(p.completed_at).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
