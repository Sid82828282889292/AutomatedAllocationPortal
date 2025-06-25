'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

  // NEW: Filters
  const [filterSkill, setFilterSkill] = useState('');
  const [filterHours, setFilterHours] = useState('');

  useEffect(() => {
    fetchInterns();
    fetchSkills();
    fetchProjects();
    fetchReport();
  }, []);

  async function fetchInterns() {
    const { data } = await supabase
      .from('users')
      .select('id, email, goal_hours')
      .eq('role', 'intern');
    if (data) setInterns(data);
  }

  async function fetchSkills() {
    const { data } = await supabase.from('skills').select('*');
    if (data) setSkills(data);
  }

  async function fetchProjects() {
    let query = supabase.from('projects').select('id, name, estimated_hours').is('assigned', null);

    if (filterSkill) {
      query = query.contains('required_skill_ids', [filterSkill]); // assuming required_skill_ids is uuid[]
    }

    if (filterHours) {
      query = query.lte('estimated_hours', Number(filterHours));
    }

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
      await supabase
        .from('projects')
        .update({ assigned: true })
        .eq('id', selectedProject);

      setMessage('✅ Project manually assigned!');
      setSelectedIntern('');
      setSelectedProject('');
      fetchProjects();
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Auto Allocation */}
      <button
        onClick={handleAutoAllocate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-10"
      >
        Auto Allocate Projects
      </button>

      {/* Project Filters */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Filter Projects</h2>
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl items-end">
          <div className="flex flex-col w-full">
            <label className="mb-1 font-medium">Skill</label>
            <select
              className="border p-2 rounded"
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
          </div>

          <div className="flex flex-col w-full">
            <label className="mb-1 font-medium">Max Estimated Hours</label>
            <input
              type="number"
              className="border p-2 rounded"
              value={filterHours}
              onChange={(e) => setFilterHours(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>

          <button
            onClick={fetchProjects}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Apply Filters
          </button>
        </div>
      </section>

      {/* Manual Project Creation */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input
            className="border p-2 rounded"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <textarea
            className="border p-2 rounded"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            type="number"
            placeholder="Estimated Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <button
            onClick={handleManualCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Create Project
          </button>
        </div>
      </section>

      {/* Manual Assignment */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Manual Project Assignment</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <select
            className="border p-2 rounded"
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
            className="border p-2 rounded"
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
          <button
            onClick={handleManualAssign}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Assign Project
          </button>
        </div>
      </section>

      {/* Interns and Their Skills */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">All Interns & Their Skills</h2>
        {interns.map((intern) => (
          <div key={intern.id} className="border p-4 mb-4 rounded bg-white shadow">
            <h3 className="font-bold text-lg">{intern.email}</h3>
            <p className="text-sm text-gray-600">Goal: {intern.goal_hours} hrs/month</p>
            <ul className="ml-4 mt-2 list-disc text-sm">
              {skills.length > 0 && <InternSkills internId={intern.id} skills={skills} />}
            </ul>
          </div>
        ))}
      </section>

      {/* Completed Projects */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Completed Projects Report</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-2">Intern</th>
              <th className="border px-3 py-2">Project</th>
              <th className="border px-3 py-2">Completed At</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.id} className="bg-white">
                <td className="border px-3 py-2">{r.users?.email || r.intern_id}</td>
                <td className="border px-3 py-2">{r.projects?.name || r.project_id}</td>
                <td className="border px-3 py-2">
                  {new Date(r.completed_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {message && <p className="text-purple-700 font-medium mt-6">{message}</p>}
    </div>
  );
}

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
