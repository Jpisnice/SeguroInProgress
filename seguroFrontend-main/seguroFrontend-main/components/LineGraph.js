import React from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const LineGraph = ({ data = [], color, label, valueLabel, monthLabel = "expiry_month", yearLabel = "expiry_year", header, xAxisLabel= 'X-axis', yAxisLabel= 'Y-axis' }) => {
    if (data) {
        const reversedData = Array.isArray(data) ? data.slice().reverse() : [];

        const labels = reversedData.map(item => `${getMonthName(item[monthLabel])} ${item[yearLabel]}`);
        const values = reversedData.map(item => item[valueLabel]);

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: values,
                    fill: false,
                    borderColor: color,
                    lineTension: 0.1,
                    showLine: true,
                },
            ],
        };

        const chartOptions = {
            scales: {
                x: {
                    type: 'category',
                    labels: labels,
                    display: true,
                    title: {
                        display: true,
                        text: xAxisLabel,
                        font: {
                            size: 14,
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                    display: true,
                    title: {
                        display: true,
                        text: yAxisLabel,
                        font: {
                            size: 14,
                        },
                    },
                    ticks: {
                        precision: 0, // Set precision to 0 for integer values
                    },
                },
            },
            plugins: {
                legend: {
                    display: false, // Set to false to hide the legend
                },
            },
        };

        return <div className='p-2 bg-white rounded-lg m-2 flex flex-col justify-center items-center lg:w-[33%]'>
            <p className='mx-auto p-2'>{header}</p>
            <Line data={chartData} options={chartOptions} />
        </div>;

    }
    return ""

};

// Helper function to convert month number to month name
const getMonthName = monthNumber => {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
        'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthNumber - 1];
};

export default LineGraph;
