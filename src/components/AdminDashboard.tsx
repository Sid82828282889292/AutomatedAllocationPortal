'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, Clock, CheckCircle, Briefcase, AlertCircle } from 'lucide-react';

const AdminCharts = dynamic(() => import('@/components/AdminCharts'), { ssr: false });

export default function AdminDashboard() {
  const [message, setMessage] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [interns, setInterns] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);

  const [selectedIntern, setSelectedIntern] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterHours, setFilterHours] = useState('');

  useEffect(() => {
    fetchInterns();
    fetchSkills();
    fetchProjects();
    fetchReport();
  }, []);

  async function fetchInterns() {
    const { data } = await supabase.from('users').select('id, email, goal_hours').eq('role', 'intern');
    if (data) setInterns(data);
  }

  async function fetchSkills() {
    const { data } = await supabase.from('skills').select('*');
    if (data) setSkills(data);
  }

  async function fetchProjects() {
    let query = supabase.from('projects').select('id, name, estimated_hours').is('assigned', null);
    if (filterSkill) query = query.contains('required_skill_ids', [filterSkill]);
    if (filterHours) query = query.lte('estimated_hours', Number(filterHours));
    const { data } = await query;
    if (data) setProjects(data);
  }

  async function fetchReport() {
    const { data } = await supabase
      .from('completed_projects')
      .select('id, project_id, intern_id, completed_at, projects(name), users(email)');
    if (data) setReport(data);
  }

  async function handleAutoAllocate() {
    const res = await fetch('/api/allocate', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setMessage(`❌ Allocation failed: ${data.error || 'Unknown error'}`);
    } else {
      setMessage('✅ Projects allocated successfully!');
      fetchProjects();
      fetchReport();
    }
  }

  async function handleManualCreate() {
    const { error } = await supabase.from('projects').insert({
      name: projectName,
      description,
      estimated_hours: parseInt(hours),
    });
    if (error) {
      setMessage('❌ Failed to create project.');
    } else {
      setMessage('✅ Project created successfully!');
      setProjectName('');
      setDescription('');
      setHours('');
      fetchProjects();
    }
  }

  async function handleManualAssign() {
    if (!selectedIntern || !selectedProject) {
      setMessage('❌ Please select both intern and project.');
      return;
    }
    const { error } = await supabase.from('intern_projects').insert({
      intern_id: selectedIntern,
      project_id: selectedProject,
      completed: false,
    });
    if (error) {
      setMessage('❌ Failed to assign project.');
    } else {
      await supabase.from('projects').update({ assigned: true }).eq('id', selectedProject);
      setMessage('✅ Project manually assigned!');
      setSelectedIntern('');
      setSelectedProject('');
      fetchProjects();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold mb-6 text-gray-900 dark:text-white"
      >
        Admin Dashboard
      </motion.h1>

      {/* Auto Allocation Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="mb-10"
      >
        <Button onClick={handleAutoAllocate} className="bg-blue-600 hover:bg-blue-700 text-white">
          Auto Allocate Projects
        </Button>
      </motion.div>

      {/* Project Filters */}
      <section className="mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-semibold text-gray-900 dark:text-white mb-4"
        >
          Filter Projects
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-4">
          <select
            className="p-2 border rounded dark:bg-gray-800 dark:text-white"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
          >
            <option value="">All Skills</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="p-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Max Estimated Hours"
            value={filterHours}
            onChange={(e) => setFilterHours(e.target.value)}
          />
          <Button onClick={fetchProjects} className="bg-indigo-600 text-white">
            Apply Filters
          </Button>
        </div>
      </section>

      {/* Manual Project Creation */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Project</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="p-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <input
            type="number"
            className="p-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Estimated Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <textarea
            className="md:col-span-3 p-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Project Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleManualCreate} className="md:col-span-3 bg-green-600 text-white">
            Create Project
          </Button>
        </div>
      </section>

      {/* Manual Assignment */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Manual Project Assignment</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="p-2 border rounded dark:bg-gray-800 dark:text-white"
            value={selectedIntern}
            onChange={(e) => setSelectedIntern(e.target.value)}
          >
            <option value="">Select Intern</option>
            {interns.map((i) => (
              <option key={i.id} value={i.id}>
                {i.email}
              </option>
            ))}
          </select>
          <select
            className="p-2 border rounded dark:bg-gray-800 dark:text-white"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button onClick={handleManualAssign} className="md:col-span-2 bg-indigo-600 text-white">
            Assign Project
          </Button>
        </div>
      </section>

      {/* Continue... */}
      {/* Interns and Their Skills */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          All Interns & Their Skills
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {interns.map((intern) => (
            <motion.div
              key={intern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {intern.email}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Goal: {intern.goal_hours} hrs/month
              </p>
              <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300">
                <InternSkills internId={intern.id} skills={skills} />
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Completed Projects */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Completed Projects Report
        </h2>
        <div className="overflow-auto rounded-lg shadow">
          <table className="min-w-full text-sm text-left text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 border">Intern</th>
                <th className="px-4 py-2 border">Project</th>
                <th className="px-4 py-2 border">Completed At</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r) => (
                <tr key={r.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border px-4 py-2">{r.users?.email || r.intern_id}</td>
                  <td className="border px-4 py-2">{r.projects?.name || r.project_id}</td>
                  <td className="border px-4 py-2">
                    {new Date(r.completed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center px-4 py-6 text-gray-500 dark:text-gray-400">
                    No completed projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Charts */}
      <section className="mt-16">
        <AdminCharts internsData={interns} reportData={report} />
      </section>

      {/* Message Notification */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white px-4 py-2 rounded shadow">
          {message}
        </div>
      )}
    </div>
  );
}

// 🧠 Subcomponent: Intern Skills per Intern
function InternSkills({ internId, skills }: { internId: string; skills: any[] }) {
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRatings() {
      const { data } = await supabase
        .from('intern_skills')
        .select('*')
        .eq('intern_id', internId);
      if (data) setRatings(data);
    }
    fetchRatings();
  }, [internId]);

  return (
    <>
      {ratings.map((r) => {
        const skillName = skills.find((s) => s.id === r.skill_id)?.name;
        return (
          <li key={r.skill_id}>
            {skillName}: {r.rating}/5
          </li>
        );
      })}
    </>
  );
}
