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
    averageBreakTime: 0,
    averageOperationTime: 0,
    productionByType: {},
  });
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: '09:00', end: '17:00' });

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

    const startTime = new Date(`${selectedDay}T${timeRange.start}`);
    const endTime = new Date(`${selectedDay}T${timeRange.end}`);
    const totalDuration = (endTime - startTime) / 1000; // in seconds

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time:</label>
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time:</label>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>
        <div className="relative h-16 bg-gray-200 rounded-lg overflow-hidden">
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
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{format(startTime, 'HH:mm:ss')}</span>
          <span>{format(endTime, 'HH:mm:ss')}</span>
        </div>
        {hoveredBar && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="font-semibold">{hoveredBar.type === 'operation' ? 'Operation' : 'Break'}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Operation Tracker</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <label htmlFor="dateSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
              <input 
                type="date" 
                id="dateSelect"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Operator:</label>
              <select
                id="userSelect"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Operation Statistics</h2>
            <p>Total Products: {stats.totalProducts}</p>
            <p>Successful Operations: {stats.successfulOperations}</p>
            <p>Errors Made: {stats.errorsMade}</p>
            <p>Errors Fixed: {stats.errorsFixed}</p>
            <p>Average Break Time: {stats.averageBreakTime.toFixed(2)} seconds</p>
            <p>Average Operation Time: {stats.averageOperationTime.toFixed(2)} seconds</p>
            <h3 className="font-semibold mt-4 mb-2">Production by Type:</h3>
            {Object.entries(stats.productionByType).map(([type, count]) => (
              <p key={type}>{type}: {count}</p>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Operation Results</h2>
            <ResponsiveContainer width="100%" height={300}>
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

        <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recent Operations</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Job Name</th>
                <th className="px-4 py-2 text-left">Operation Duration (s)</th>
                <th className="px-4 py-2 text-left">Rotations</th>
                <th className="px-4 py-2 text-left">Break Duration (s)</th>
                <th className="px-4 py-2 text-left">Expected Rotations</th>
                <th className="px-4 py-2 text-left">Success</th>
                <th className="px-4 py-2 text-left">Fixed</th>
                <th className="px-4 py-2 text-left">Start Time</th>
              </tr>
            </thead>
            <tbody>
              {operations
                .filter(op => !selectedUser || op.user === selectedUser)
                .map((op) => (
                  <tr key={op.id} className="border-b">
                    <td className="px-4 py-2">{op.user}</td>
                    <td className="px-4 py-2">{op.jobName}</td>
                    <td className="px-4 py-2">{op.operationDuration.toFixed(2)}</td>
                    <td className="px-4 py-2">{op.rotations.join(', ')}</td>
                    <td className="px-4 py-2">{op.breakDuration.toFixed(2)}</td>
                    <td className="px-4 py-2">{op.expectedRotations.join(', ')}</td>
                    <td className="px-4 py-2">{op.success ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{op.fixed ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{format(parseISO(op.startTime), 'HH:mm:ss')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
