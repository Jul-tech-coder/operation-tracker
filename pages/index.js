import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, addHours, differenceInSeconds } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const generateMockData = (startTime, endTime) => {
  const data = [];
  let currentTime = startTime;
  let operationId = 1;

  while (currentTime < endTime) {
    const operationDuration = Math.floor(Math.random() * 300) + 60; // 1-5 minutes
    const breakDuration = Math.floor(Math.random() * 600) + 300; // 5-15 minutes

    const jobTypes = [
      { rotations: [10, 10], name: "10-10 Fabric" },
      { rotations: [15, 15, 15, 15], name: "15-15-15-15 Fabric" },
      { rotations: [20, 20], name: "20-20 Fabric" },
    ];

    const selectedJob = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const actualRotations = selectedJob.rotations.map(r => r + Math.floor(Math.random() * 5) - 2); // Add some variation

    const operation = {
      id: operationId++,
      user: Math.floor(Math.random() * 5) + 101, // Users 101-105
      operationDuration: operationDuration,
      rotations: actualRotations,
      breakDuration: breakDuration,
      expectedRotations: selectedJob.rotations,
      jobName: selectedJob.name,
      success: JSON.stringify(actualRotations) === JSON.stringify(selectedJob.rotations),
      fixed: Math.random() < 0.7, // 70% chance of fixing if there was an error
      startTime: currentTime.toISOString(),
      endTime: new Date(currentTime.getTime() + operationDuration * 1000).toISOString(),
    };

    data.push(operation);

    currentTime = new Date(currentTime.getTime() + (operationDuration + breakDuration) * 1000);
  }

  return data;
};

export default function Home() {
  const [operations, setOperations] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    successfulOperations: 0,
    errorsMade: 0,
    errorsFixed: 0,
    averageBreakTime: 0,
    averageOperationTime: 0,
    productionByType: {},
  });
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const startOfDay = new Date(selectedDay);
    startOfDay.setHours(9, 0, 0, 0); // Assume 9 AM start
    const endOfDay = addHours(startOfDay, 8); // 8-hour shift

    const mockData = generateMockData(startOfDay, endOfDay);
    setOperations(mockData);

    // Calculate statistics
    const totalProducts = mockData.length;
    const successfulOperations = mockData.filter(op => op.success || op.fixed).length;
    const errorsMade = mockData.filter(op => !op.success).length;
    const errorsFixed = mockData.filter(op => op.fixed).length;
    const averageBreakTime = mockData.reduce((acc, op) => acc + op.breakDuration, 0) / totalProducts;
    const averageOperationTime = mockData.reduce((acc, op) => acc + op.operationDuration, 0) / totalProducts;

    const productionByType = mockData.reduce((acc, op) => {
      if (!acc[op.jobName]) acc[op.jobName] = 0;
      if (op.success || op.fixed) acc[op.jobName]++;
      return acc;
    }, {});

    setStats({
      totalProducts,
      successfulOperations,
      errorsMade,
      errorsFixed,
      averageBreakTime,
      averageOperationTime,
      productionByType,
    });
  }, [selectedDay]);

  const Timeline = ({ data }) => {
    const [hoveredBar, setHoveredBar] = useState(null);

    const timelineData = data.flatMap(op => [
      { type: 'operation', duration: op.operationDuration, startTime: new Date(op.startTime), color: '#FF6B6B' },
      { type: 'break', duration: op.breakDuration, startTime: new Date(op.endTime), color: '#4ECDC4' }
    ]);

    const totalDuration = timelineData.reduce((sum, item) => sum + item.duration, 0);

    return (
      <div style={{ position: 'relative', height: '50px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
        {timelineData.map((item, index) => {
          const widthPercentage = (item.duration / totalDuration) * 100;
          const leftPosition = timelineData
            .slice(0, index)
            .reduce((sum, prevItem) => sum + (prevItem.duration / totalDuration) * 100, 0);

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${leftPosition}%`,
                width: `${widthPercentage}%`,
                height: '100%',
                backgroundColor: item.color,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredBar(item)}
              onMouseLeave={() => setHoveredBar(null)}
            />
          );
        })}
        {hoveredBar && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: 'white',
            padding: '10px',
            border: '1px solid #ddd',
            zIndex: 1000,
          }}>
            <p>{hoveredBar.type === 'operation' ? 'Operation' : 'Break'}</p>
            <p>Duration: {hoveredBar.duration} seconds</p>
            <p>Start Time: {format(hoveredBar.startTime, 'HH:mm:ss')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>Detailed Operation Tracker</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="dateSelect">Select Date: </label>
        <input 
          type="date" 
          id="dateSelect"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        />
      </div>

      <Timeline data={operations} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ width: '48%' }}>
          <h2 style={{ color: '#666' }}>Operation Statistics</h2>
          <p>Total Products: {stats.totalProducts}</p>
          <p>Successful Operations: {stats.successfulOperations}</p>
          <p>Errors Made: {stats.errorsMade}</p>
          <p>Errors Fixed: {stats.errorsFixed}</p>
          <p>Average Break Time: {stats.averageBreakTime.toFixed(2)} seconds</p>
          <p>Average Operation Time: {stats.averageOperationTime.toFixed(2)} seconds</p>
          <h3>Production by Type:</h3>
          {Object.entries(stats.productionByType).map(([type, count]) => (
            <p key={type}>{type}: {count}</p>
          ))}
        </div>
        <div style={{ width: '48%', height: '300px' }}>
          <h2 style={{ color: '#666' }}>Operation Results</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Successful', value: stats.successfulOperations },
                  { name: 'Errors', value: stats.errorsMade },
                  { name: 'Fixed', value: stats.errorsFixed },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.successfulOperations > 0 && <Cell key={`cell-0`} fill={COLORS[0]} />}
                {stats.errorsMade > 0 && <Cell key={`cell-1`} fill={COLORS[1]} />}
                {stats.errorsFixed > 0 && <Cell key={`cell-2`} fill={COLORS[2]} />}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#666' }}>Recent Operations</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>User</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Job Name</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Operation Duration (s)</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Rotations</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Break Duration (s)</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Expected Rotations</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Success</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Fixed</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Start Time</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op) => (
                <tr key={op.id}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.user}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.jobName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.operationDuration.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.rotations.join(', ')}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.breakDuration.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.expectedRotations.join(', ')}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.success ? 'Yes' : 'No'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.fixed ? 'Yes' : 'No'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{format(new Date(op.startTime), 'HH:mm:ss')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
