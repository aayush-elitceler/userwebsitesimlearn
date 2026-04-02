'use client';
import {
  Chart as ChartJS,
  Tooltip,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(Tooltip, CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function LazyLineChart({ data, options }: { data: any; options: any }) {
  return <Line data={data} options={options} />;
}
