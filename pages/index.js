import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, addHours, differenceInSeconds } from 'date-fns';

const COLORS = ['#4CAF50', '#FFC107', '#F44336', '#2196F3'];

const generateMockData = (startTime, endTime) => {
  const data = [];
  const users = [101, 102, 103, 104, 105]; // 5 operators
  let operationId = 1;

  users.forEach(user => {
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const operationDuration = Math.floor(Math.random() * 31) + 10; // 10-40 seconds
      const breakDuration = Math.floor(Math.random() * 51) + 10; // 10-60 seconds

      const jobTypes = [
        { rotations: [10, 10], name: "10-10 Fabric" },
        { rotations: [15, 15, 15, 15], name: "15-15-15-15 Fabric" },
        { rotations: [20, 20], name: "20-20 Fabric" },
      ];

      const selectedJob = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const isError = Math.random() < 0.03; // 3% chance of error
      const actualRotations = isError 
        ? selectedJob.rotations.map(r => r + Math.floor(Math.random() * 5) - 2)
        : [...selectedJob.rotations];

      const operation = {
        id: operationId++,
        user: user,
        operationDuration: operationDuration,
        rotations: actualRotations,
        breakDuration: breakDuration,
        expectedRotations: selectedJob.rotations,
        jobName: selectedJob.name,
        success: !isError,
        fixed: isError && Math.random() < 0.7, // 70% chance of fixing if there was an error
        startTime: currentTime.toISOString(),
        endTime: new Date(currentTime.getTime() + operationDuration * 1000).toISOString(),
      };

      data.push(operation);

      currentTime = new Date(currentTime.getTime() + (operationDuration + breakDuration) * 1000);
    }
  });

  return data;
};

export default function Home() {
  const [operations, setOperations] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    successfulOperations: 0,
    errorsMade: 0,
    errorsFixed: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    productionByType: {},
  });
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: '09:00', end: '17:00' });
  const [hoveredBar, setHoveredBar] = useState(null);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    const startOfDay = new Date(selectedDay);
    startOfDay.setHours(9, 0, 0, 0); // Assume 9 AM start
    const endOfDay = addHours(startOfDay, 8); // 8-hour shift

    const mockData = generateMockData(startOfDay, endOfDay);
    setOperations(mockData);

    // Calculate statistics
    const filteredData = selectedUser ? mockData.filter(op => op.user === selectedUser) : mockData;
    const totalProducts = filteredData.length;
    const successfulOperations = filteredData.filter(op => op.success).length;
    const errorsMade = filteredData.filter(op => !op.success).length;
    const errorsFixed = filteredData.filter(op => !op.success && op.fixed).length;
    const totalWorkTime = filteredData.reduce((acc, op) => acc + op.operationDuration, 0);
    const totalBreakTime = filteredData.reduce((acc, op) => acc + op.breakDuration, 0);

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
      totalWorkTime,
      totalBreakTime,
      productionByType,
    });
  }, [selectedDay, selectedUser]);

  const Timeline = ({ data }) => {
    const timelineData = data.flatMap(op => [
      { type: 'operation', duration: op.operationDuration, startTime: new Date(op.startTime), color: op.success ? '#4CAF50' : (op.fixed ? '#FFC107' : '#F44336'), data: op },
      { type: 'break', duration: op.breakDuration, startTime: new Date(op.endTime), color: '#BDBDBD', data: op }
    ]);

    const startTime = new Date(`${selectedDay}T${timeRange.start}`);
    const endTime = new Date(`${selectedDay}T${timeRange.end}`);
    const totalDuration = (endTime - startTime) / 1000; // in seconds

    return (
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Start Time:</label>
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>End Time:</label>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
            />
          </div>
        </div>
        <div style={{ position: 'relative', height: '4rem', backgroundColor: '#E5E7EB', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {timelineData.map((item, index) => {
            const itemStart = new Date(item.startTime);
            if (itemStart < startTime || itemStart > endTime) return null;

            const leftPosition = ((itemStart - startTime) / 1000 / totalDuration) * 100;
            const width = (item.duration / totalDuration) * 100;

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${leftPosition}%`,
                  width: `${width}%`,
                  height: '100%',
                  backgroundColor: item.color,
                }}
                onMouseEnter={() => setHoveredBar(item)}
                onMouseLeave={() => setHoveredBar(null)}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
          <span>{format(startTime, 'HH:mm:ss')}</span>
          <span>{format(endTime, 'HH:mm:ss')}</span>
        </div>
        <div style={{ height: '150px', marginTop: '1rem', padding: '0.75rem', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', overflowY: 'auto' }}>
          {hoveredBar ? (
            <>
              <p style={{ fontWeight: '600' }}>{hoveredBar.type === 'operation' ? 'Operation' : 'Break'}</p>
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
            </>
          ) : (
            <p>Hover over a bar to see details</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #EBF4FF, #F3E8FF, #FDF2F8)', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '3rem', color: '#1F2937' }}>Operation Tracker</h1>
        
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="dateSelect" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Select Date:</label>
              <input 
                type="date" 
                id="dateSelect"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
              />
            </div>
            <div>
              <label htmlFor="userSelect" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Select Operator:</label>
              <select
                id="userSelect"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
                style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }}
              >
                <option value="">All Operators</option>
                {[...new Set(operations.map(op => op.user))].map(user => (
                  <option key={user} value={user}>Operator {user}</option>
                ))}
              </select>
            </div>
          </div>

          <Timeline data={operations.filter(op => !selectedUser || op.user === selectedUser)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1F2937' }}>Operation Statistics</h2>
            <p>Total Products: {stats.totalProducts}</p>
            <p>Successful Operations: {stats.successfulOperations}</p>
            <p>Errors Made: {stats.errorsMade}</p>
            <p>Errors Fixed: {stats.errorsFixed}</p>
            <p>Total Work Time: {formatTime(stats.totalWorkTime)}</p>
            <p>Total Break Time: {formatTime(stats.totalBreakTime)}</p>
            <h3 style={{ fontWeight: '600', marginTop: '1rem', marginBottom: '0.5rem' }}>Production by Type:</h3>
            {Object.entries(stats.productionByType).map(([type, count]) => (
              <p key={type}>{type}: {count}</p>
            ))}
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1F2937' }}>Operation Results and Break Time</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <ResponsiveContainer width="45%" height={300}>
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
              <ResponsiveContainer width="45%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Work Time', value: stats.totalWorkTime },
                      { name: 'Break Time', value: stats.totalBreakTime },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell key={`cell-0`} fill={COLORS[0]} />
                    <Cell key={`cell-1`} fill={COLORS[3]} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1F2937' }}>Recent Operations</h2>
          <table style={{ minWidth: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>User</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Job Name</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Operation Duration (s)</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Rotations</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Break Duration (s)</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Expected Rotations</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Success</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Fixed</th>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Start Time</th>
              </tr>
            </thead>
            <tbody>
              {operations
                .filter(op => !selectedUser || op.user === selectedUser)
                .map((op) => (
                  <tr key={op.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.user}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.jobName}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.operationDuration.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.rotations.join(', ')}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.breakDuration.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.expectedRotations.join(', ')}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.success ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{op.fixed ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{format(parseISO(op.startTime), 'HH:mm:ss')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
