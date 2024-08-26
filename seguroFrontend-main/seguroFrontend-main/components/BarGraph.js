import React from 'react';
import { Bar } from 'react-chartjs-2';

const BarGraph = ({ data }) => {
    if(data !== undefined){
        
    }
  const labels = data?.map(item => `${getMonthName(item.expiry_month)} ${item.expiry_year}`);
  const values = data?.map(item => item.plansExpireOnThisMonth);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Plans Expire',
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75,192,192,0.6)',
        hoverBorderColor: 'rgba(75,192,192,1)',
        data: values,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: { title: { display: true, text: 'Expiry Months' } },
      y: { title: { display: true, text: 'Plans Expire on This Month' }, beginAtZero: true },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};

const getMonthName = month => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1];
};

export default BarGraph;
