import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export const chartPalette = ['#e11d48', '#fb7185', '#9f1239', '#fda4af', '#be123c', '#64748b']
