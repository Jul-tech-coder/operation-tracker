import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

export default function Home() {
  const [operations, setOperations] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    successfulOperations: 0,
    errorsMade: 0,
    errorsFixed: 0,
    averageBreakTime: 0,
    averageOperationTime: 0,
  });

  useEffect(() => {
    // Mock data based on your example
    const mockData = [
      {
        id: 1,
        user: 102,
        operationDuration: 19.84,
        rotations: [10, 16],
        breakDuration: 27.99,
        expectedRotations: [10, 10],
        success: false,
        fixed: true,
        timestamp: '2023-07-04T10:00:00',
      },
      // Add more mock operations here...
    ];
    setOperations(mockData);

    // Calculate statistics
    const totalProducts = mockData.length;
    const successfulOperations = mockData.filter(op => op.success || op.fixed).length;
    const errorsMade = mockData.filter(op => !op.success).length;
    const errorsFixed = mockData.filter(op => op.fixed).length;
    const averageBreakTime = mockData.reduce((acc, op) => acc + op.breakDuration, 0) / totalProducts;
    const averageOperationTime = mockData.reduce((acc, op) => acc + op.operationDuration, 0) / totalProducts;

    setStats({
      totalProducts,
      successfulOperations,
      errorsMade,
      errorsFixed,
      averageBreakTime,
      averageOperationTime,
    });
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>Detailed Operation Tracker</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ width: '48%' }}>
          <h2 style={{ color: '#666' }}>Operation Statistics</h2>
          <p>Total Products: {stats.totalProducts}</p>
          <p>Successful Operations: {stats.successfulOperations}</p>
          <p>Errors Made: {stats.errorsMade}</p>
          <p>Errors Fixed: {stats.errorsFixed}</p>
          <p>Average Break Time: {stats.averageBreakTime.toFixed(2)} seconds</p>
          <p>Average Operation Time: {stats.averageOperationTime.toFixed(2)} seconds</p>
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
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Operation Duration (s)</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Rotations</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Break Duration (s)</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Expected Rotations</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Success</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Fixed</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op) => (
                <tr key={op.id}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.user}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.operationDuration.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.rotations.join(', ')}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.breakDuration.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.expectedRotations.join(', ')}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.success ? 'Yes' : 'No'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.fixed ? 'Yes' : 'No'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{format(new Date(op.timestamp), 'yyyy-MM-dd HH:mm:ss')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ width: '48%', height: '300px' }}>
          <h2 style={{ color: '#666' }}>Operation Duration Over Time</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={operations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} />
              <YAxis />
              <Tooltip labelFormatter={(timestamp) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')} />
              <Legend />
              <Line type="monotone" dataKey="operationDuration" name="Operation Duration" stroke="#8884d8" />
              <Line type="monotone" dataKey="breakDuration" name="Break Duration" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '48%', height: '300px' }}>
          <h2 style={{ color: '#666' }}>Success Rate by User</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={
              operations.reduce((acc, op) => {
                const userIndex = acc.findIndex(item => item.user === op.user);
                if (userIndex === -1) {
                  acc.push({ user: op.user, successful: op.success || op.fixed ? 1 : 0, total: 1 });
                } else {
                  acc[userIndex].successful += op.success || op.fixed ? 1 : 0;
                  acc[userIndex].total += 1;
                }
                return acc;
              }, []).map(item => ({
                user: item.user,
                successRate: (item.successful / item.total) * 100
              }))
            }>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successRate" fill="#82ca9d" name="Success Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
