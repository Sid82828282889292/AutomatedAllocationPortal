'use client';

import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500
      },
      {
        label: 'Completed Projects',
        data: completedByIntern,
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // green-500
      },
    ],
  };

  const pieData = {
    labels,
    datasets: [
      {
        label: 'Project Completion Share',
        data: completedByIntern,
        backgroundColor: [
          '#60a5fa',
          '#f87171',
          '#34d399',
          '#facc15',
          '#c084fc',
          '#38bdf8',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="mt-10 space-y-12">
      <div className="h-[400px] w-full md:w-2/3 mx-auto">
        <h2 className="text-lg font-semibold mb-4">Hours vs Projects (Bar Chart)</h2>
        <Bar data={barData} options={chartOptions} />
      </div>
      <div className="h-[400px] w-full md:w-2/3 mx-auto">
        <h2 className="text-lg font-semibold mb-4">Project Distribution (Pie Chart)</h2>
        <Pie data={pieData} options={chartOptions} />
      </div>
    </div>
  );
}
