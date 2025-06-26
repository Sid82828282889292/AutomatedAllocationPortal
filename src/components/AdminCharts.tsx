'use client';

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import React from 'react';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function AdminCharts({
  internsData,
  reportData,
}: {
  internsData: any[];
  reportData: any[];
}) {
  const assignedHours = internsData.map((i) => i.goal_hours || 0);
  const completedByIntern = internsData.map((intern) =>
    reportData.filter((r) => r.intern_id === intern.id).length
  );
  const labels = internsData.map((i) => i.email);

  const barData = {
    labels,
    datasets: [
      {
        label: 'Goal Hours',
        data: assignedHours,
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Tailwind blue-500
      },
      {
        label: 'Completed Projects',
        data: completedByIntern,
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // Tailwind green-500
      },
    ],
  };

  const pieData = {
    labels,
    datasets: [
      {
        label: 'Completion Share',
        data: completedByIntern,
        backgroundColor: [
          '#60a5fa', // blue-400
          '#f87171', // red-400
          '#34d399', // green-400
          '#facc15', // yellow-400
          '#c084fc', // purple-400
          '#38bdf8', // sky-400
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
      {/* Bar Chart Card */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Hours vs Completed Projects
        </h3>
        <div className="h-80">
          <Bar data={barData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Pie Chart Card */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Project Completion Distribution
        </h3>
        <div className="h-80">
          <Pie data={pieData} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
}
