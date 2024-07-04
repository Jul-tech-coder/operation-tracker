import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [operations, setOperations] = useState([]);

  useEffect(() => {
    // In a real application, this would fetch data from your API
    const mockData = [
      { id: 1, picoId: 'Pico1', user: 101, operationCount: 50, duration: 120, rotations: [10, 15, 20], timestamp: '2023-07-03T10:00:00' },
      { id: 2, picoId: 'Pico2', user: 102, operationCount: 45, duration: 110, rotations: [12, 18, 15], timestamp: '2023-07-03T10:15:00' },
      { id: 3, picoId: 'Pico1', user: 101, operationCount: 55, duration: 130, rotations: [11, 16, 22], timestamp: '2023-07-03T10:30:00' },
    ];
    setOperations(mockData);
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333' }}>Operation Tracker</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#666' }}>Recent Operations</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Pico ID</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>User</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Operation Count</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Duration (s)</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Rotations</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id}>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.picoId}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.user}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.operationCount}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.duration}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.rotations.join(', ')}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{new Date(op.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ height: '400px' }}>
        <h2 style={{ color: '#666' }}>Operation Count Over Time</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={operations}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="operationCount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
