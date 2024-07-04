import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function Home() {
  const [operations, setOperations] = useState([]);
  const [filteredOperations, setFilteredOperations] = useState([]);
  const [filterPicoId, setFilterPicoId] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // In a real application, this would fetch data from your API
    const mockData = [
      { id: 1, picoId: 'Pico1', user: 101, operationCount: 50, duration: 120, rotations: [10, 15, 20], timestamp: '2023-07-03T10:00:00' },
      { id: 2, picoId: 'Pico2', user: 102, operationCount: 45, duration: 110, rotations: [12, 18, 15], timestamp: '2023-07-03T10:15:00' },
      { id: 3, picoId: 'Pico1', user: 101, operationCount: 55, duration: 130, rotations: [11, 16, 22], timestamp: '2023-07-03T10:30:00' },
      { id: 4, picoId: 'Pico3', user: 103, operationCount: 60, duration: 140, rotations: [13, 17, 25], timestamp: '2023-07-03T10:45:00' },
      { id: 5, picoId: 'Pico2', user: 102, operationCount: 48, duration: 115, rotations: [11, 19, 18], timestamp: '2023-07-03T11:00:00' },
    ];
    setOperations(mockData);
    setFilteredOperations(mockData);
  }, []);

  useEffect(() => {
    let filtered = operations;
    if (filterPicoId) {
      filtered = filtered.filter(op => op.picoId === filterPicoId);
    }
    if (filterUser) {
      filtered = filtered.filter(op => op.user === parseInt(filterUser));
    }
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(op => {
        const opDate = new Date(op.timestamp);
        return opDate >= new Date(dateRange.start) && opDate <= new Date(dateRange.end);
      });
    }
    setFilteredOperations(filtered);
  }, [operations, filterPicoId, filterUser, dateRange]);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>Operation Tracker</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Filter by Pico ID" 
          value={filterPicoId} 
          onChange={(e) => setFilterPicoId(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          type="text" 
          placeholder="Filter by User" 
          value={filterUser} 
          onChange={(e) => setFilterUser(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          type="date" 
          value={dateRange.start} 
          onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          type="date" 
          value={dateRange.end} 
          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          style={{ padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#666' }}>Recent Operations</h2>
        <div style={{ overflowX: 'auto' }}>
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
              {filteredOperations.map((op) => (
                <tr key={op.id}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.picoId}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.user}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.operationCount}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.duration}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{op.rotations.join(', ')}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{format(new Date(op.timestamp), 'yyyy-MM-dd HH:mm:ss')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ width: '48%', height: '300px' }}>
          <h2 style={{ color: '#666' }}>Operation Count Over Time</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredOperations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} />
              <YAxis />
              <Tooltip labelFormatter={(timestamp) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')} />
              <Legend />
              <Line type="monotone" dataKey="operationCount" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '48%', height: '300px' }}>
          <h2 style={{ color: '#666' }}>Duration by Pico ID</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredOperations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="picoId" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="duration" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
