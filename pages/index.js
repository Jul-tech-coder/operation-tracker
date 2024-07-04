import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, addHours, differenceInSeconds, parseISO, addSeconds } from 'date-fns';

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
    const isError = Math.random() < 0.03; // 3% chance of error
    const actualRotations = isError 
      ? selectedJob.rotations.map(r => r + Math.floor(Math.random() * 5) - 2)
      : [...selectedJob.rotations];

    const operation = {
      id: operationId++,
      user: Math.floor(Math.random() * 5) + 101, // Users 101-105
      operationDuration: operationDuration,
      rotations: actualRotations,
      breakDuration: breakDuration,
      expectedRotations: selectedJob.rotations,
      jobName: selectedJob.name,
      success: !isError,
      fixed: isError && Math.random() < 0.7, // 70% chance of fixing if there was an error
      startTime: currentTime.toISOString(),
      endTime: addSeconds(currentTime, operationDuration).toISOString(),
    };

    data.push(operation);

    currentTime = addSeconds(currentTime, operationDuration + breakDuration);
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
  const [timelineStart, setTimelineStart] = useState(0);
  const [timelineEnd, setTimelineEnd] = useState(8 * 60 * 60); // 8 hours in seconds
  const timelineRef = useRef(null);

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
      { type: 'operation', duration: op.operationDuration, startTime: new Date(op.startTime), color: op.success ? '#4CAF50' : (op.fixed ? '#FFC107' : '#F44336'), data: op },
      { type: 'break', duration: op.breakDuration, startTime: new Date(op.endTime), color: '#BDBDBD', data: op }
    ]);

    const totalDuration = 8 * 60 * 60; // 8 hours in seconds
    const visibleDuration = timelineEnd - timelineStart;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const mousePosition = (e.clientX - timelineRef.current.getBoundingClientRect().left) / timelineRef.current.offsetWidth;
      const newVisibleDuration = Math.min(Math.max(visibleDuration * zoomFactor, 60), totalDuration);
      const newStart = Math.max(0, timelineStart + (visibleDuration - newVisibleDuration) * mousePosition);
      const newEnd = Math.min(totalDuration, newStart + newVisibleDuration);
      setTimelineStart(newStart);
      setTimelineEnd(newEnd);
    };

    return (
      <div>
        <div 
          ref={timelineRef}
          style={{ position: 'relative', height: '50px', backgroundColor: '#f0f0f0', marginBottom: '20px', overflow: 'hidden' }}
          onWheel={handleWheel}
        >
          {timelineData.map((item, index) => {
            const startSeconds = differenceInSeconds(item.startTime, new Date(selectedDay));
            const endSeconds = startSeconds + item.duration;
            if (endSeconds < timelineStart || startSeconds > timelineEnd) return null;

            const leftPosition = ((Math.max(startSeconds, timelineStart) - timelineStart) / visibleDuration) * 100;
            const rightPosition = ((Math.min(endSeconds, timelineEnd) - timelineStart) / visibleDuration) * 100;
            const width = rightPosition - leftPosition;

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${leftPosition}%`,
                  width: `${width}%`,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>{format(addSeconds(new Date(selectedDay), timelineStart), 'HH:mm:ss')}</span>
          <span>{format(addSeconds(new Date(selectedDay), timelineEnd), 'HH:mm:ss')}</span>
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

      {/* Rest of the component remains the same */}
    </div>
  );
}
