import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, addHours, differenceInSeconds, parseISO } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const generateMockData = (startTime, endTime) => {
  const data = [];
  let currentTime = startTime;
  let operationId = 1;

  while (currentTime < endTime) {
    const operationDuration = Math.floor(Math.random() * 31) + 10; // 10-40 seconds
    const breakDuration = Math.floor(Math.random() * 51) + 10; // 10-60 seconds

    const jobTypes = [
      { rotations: [10, 10], name: "10-10 Fabric" },
      { rotations: [15, 15, 15, 15], name: "15-15-15-15 Fabric" },
      { rotations: [20, 20], name: "20-20 Fabric" },
    ];

    const selectedJob = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const actualRotations = selectedJob.rotations.map(r => {
      const errorChance = Math.random();
      return errorChance < 0.03 ? r + Math.floor(Math.random() * 5) - 2 : r; // 3% chance of error
    });

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
  const [selectedUser, setSelectedUser] = useState(null);
  const [timelineZoom, setTimelineZoom] = useState(1);

  useEffect(() => {
    const startOfDay = new Date(selectedDay);
    startOfDay.setHours(9, 0, 0, 0); // Assume 9 AM start
    const endOfDay = addHours(startOfDay, 8); // 8-hour shift

    const mockData = generateMockData(startOfDay, endOfDay);
    setOperations(mockData);

    // Calculate statistics
    const filteredData = selectedUser ? mockData.filter(op => op.user === selectedUser) : mockData;
    const totalProducts = filteredData.length;
    const successfulOperations = filteredData.filter(op => op.success || op.fixed).length;
    const errorsMade = filteredData.filter(op => !op.success).length;
    const errorsFixed = filteredData.filter(op => op.fixed).length;
    const averageBreakTime = filteredData.reduce((acc, op) => acc + op.breakDuration, 0) / totalProducts;
    const averageOperationTime = filteredData.reduce((acc, op) => acc + op.operationDuration, 0) / totalProducts;

    const productionByType = filteredData.reduce((acc, op) => {
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
  }, [selectedDay, selectedUser]);

  const Timeline = ({ data }) => {
    const [hoveredBar, setHoveredBar] = useState(null);

    const timelineData = data.flatMap(op => [
      { type: 'operation', duration: op.operationDuration, startTime: new Date(op.startTime), color: '#FF6B6B', data: op },
      { type: 'break', duration: op.breakDuration, startTime: new Date(op.endTime), color: '#4ECDC4', data: op }
    ]);

    const totalDuration = timelineData.reduce((sum, item) => sum + item.duration, 0);
    const zoomedDuration = totalDuration / timelineZoom;

    const visibleData = timelineData.filter((_, index) => index < zoomedDuration);

    return (
      <div>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setTimelineZoom(prev => Math.min(prev * 2, 32))}>Zoom In</button>
          <button onClick={() => setTimelineZoom(prev => Math.max(prev / 2, 1))}>Zoom Out</button>
          <span style={{ marginLeft: '10px' }}>Zoom: {timelineZoom}x</span>
        </div>
        <div style={{ position: 'relative', height: '50px', backgroundColor: '#f0f0f0', marginBottom: '20px', overflow: 'hidden' }}>
          {visibleData.map((item, index) => {
            const widthPercentage = (item.duration / zoomedDuration) * 100;
            const leftPosition = visibleData
              .slice(0, index)
              .reduce((sum, prevItem) => sum + (prevItem.duration / zoomedDuration) * 100, 0);

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
        </div>
        {hoveredBar && (
          <div style={{
            backgroundColor: 'white',
            padding: '10px',
            border: '1px solid #ddd',
            marginBottom: '20px',
          }}>
            <p>{hoveredBar.type === 'operation' ? 'Operation' : 'Break'}</p>
            <p>Duration: {hoveredBar.duration} seconds</p>
            <p>Start Time: {format(hoveredBar.startTime, 'HH:mm:ss')}</p>
            {hoveredBar.type === 'operation' && (
              <>
                <p>Job: {hoveredBar.data.jobName}</p>
                <p>Rotations: {hoveredBar.data.rotations.join(', ')}</p>
                <p>Success: {hoveredBar.data.success ? 'Yes' : 'No'}</p>
                {!hoveredBar.data.success && <p>Fixed: {hoveredBar.data.fixed ? 'Yes' : 'No'}</p>}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const uniqueUsers = [...new Set(operations.map(op => op.user))];

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
        <label htmlFor="userSelect" style={{ marginLeft: '20px' }}>Select Operator: </label>
        <select
          id="userSelect"
          value={selectedUser || ''}
          onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Operators</option>
          {uniqueUsers.map(user => (
            <option key={user} value={user}>Operator {user}</option>
          ))}
        </select>
      </div>

      <Timeline data={operations.filter(op => !selectedUser || op.user === selectedUser)} />

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
              {operations
                .filter(op => !selectedUser || op.user === selectedUser)
                .map((op) => (
                  <tr key={op.id}>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.user}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.jobName}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.operationDuration.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.rotations.join(', ')}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.breakDuration.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.expectedRotations.join(', ')}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.success ? 'Yes' : 'No'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.fixed ? 'Yes' : 'No'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{format(parseISO(op.startTime), 'HH:mm:ss')}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
