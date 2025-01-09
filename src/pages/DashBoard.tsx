import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BsMoonStars, BsCloudSun, BsSearch } from 'react-icons/bs';
import { FaCheck, FaEdit, FaTrash, FaPlus, FaPray } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  isAnonymous: boolean;
  photoURL: string;
  providerData: ProviderData[];
  stsTokenManager: StsTokenManager;
  createdAt: string;
  lastLoginAt: string;
  apiKey: string;
  appName: string;
}

interface ProviderData {
  providerId: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  photoURL: string;
}

interface StsTokenManager {
  refreshToken: string;
  accessToken: string;
  expirationTime: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

export const DashBoard = () => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending"
  });

  useEffect(() => {
    const user = localStorage.getItem("userInfo");
    if (user) {
      try {
        const userData: User = JSON.parse(user);
        setUserInfo(userData);
      } catch (error) {
        setError("Error loading user information");
      }
    } else {
      setError("User not authenticated");
    }

    setLoading(false);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const mockTasks: Task[] = [
        { id: 1, title: "Complete Project Report", description: "Write the final report for the project.", dueDate: "2025-02-10", status: "completed", priority: "high" },
        { id: 2, title: "Team Meeting", description: "Discuss project milestones and next steps.", dueDate: "2024-12-15", status: "completed", priority: "medium" },
        { id: 3, title: "Bug Fixing", description: "Resolve bugs in the login module.", dueDate: "2025-01-05", status: "pending", priority: "high" },
      ];
      setTasks(mockTasks);
    } catch (error) {
      setError("Failed to fetch tasks.");
    }
  };

  const handleCreateTask = () => {
    const task = {
      ...newTask,
      id: tasks.length + 1,
      status: "pending"
    } as Task;
    
    setTasks([...tasks, task]);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      status: "pending"
    });
    setIsModalOpen(false);
  };

  const handleUpdateTask = (taskId: number, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    return [
      { name: 'Completed', value: completed },
      { name: 'Pending', value: pending }
    ];
  };

  const COLORS = ['#8B5CF6', '#3730A3'];

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!userInfo) return <Navigate to="/" replace />;

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} min-h-screen transition-all`}>
      <header className="bg-purple-900 shadow-lg mb-8 p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Task Manager</h1>
        <div className="flex items-center space-x-4">
          <button
            className="p-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <BsMoonStars size={20} /> : <BsCloudSun size={20} />}
          </button>
          <img
            src={userInfo.photoURL || '/placeholder.jpg'}
            alt="User Avatar"
            className="w-12 h-12 rounded-full border-2 border-white"
          />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500"
            />
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> New Task
          </button>
        </div>

        {/* Modal for creating new task */}
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="fixed inset-0 z-50 overflow-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg mx-auto max-w-lg w-full p-6 shadow-xl`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create New Task</h2>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <input
                      placeholder="Task Title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className={`w-full p-2 rounded border ${darkMode && 'bg-gray-700 border-gray-600'} focus:outline-none focus:border-purple-500`}
                    />
                    <textarea
                      placeholder="Description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className={`w-full p-2 rounded border ${darkMode && 'bg-gray-700 border-gray-600'} focus:outline-none focus:border-purple-500`}
                      rows={3}
                    />
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className={`w-full p-2 rounded border ${darkMode && 'bg-gray-700 border-gray-600'} focus:outline-none focus:border-purple-500`}
                    />
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as Task['priority']})}
                      className={`w-full p-2 rounded border ${darkMode && 'bg-gray-700 border-gray-600'} focus:outline-none focus:border-purple-500`}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks List */}
          <div className={`${darkMode ?'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 max-h-[600px] overflow-y-auto`}>
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`relative p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg
                    ${task.status === 'completed' ? 'bg-purple-100 dark:bg-purple-900' : 'bg-white dark:bg-gray-700'}
                    ${task.priority === 'high' ? 'border-l-4 border-red-500' :
                      task.priority === 'medium' ? 'border-l-4 border-yellow-500' :
                      'border-l-4 border-green-500'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{task.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due: {task.dueDate}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`p-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <FaCheck className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 rounded-full bg-red-500 text-white"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 h-[600px] flex flex-col`}>
            <h2 className="text-xl font-semibold mb-4">Task Statistics</h2>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getTaskStats()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getTaskStats().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashBoard;