import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BsMoonStars, BsCloudSun, BsSearch, BsSortUp, BsSortDown } from "react-icons/bs";
import { FaCheck, FaTrash, FaPlus } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { db } from "../fire_base/firebaseConfig";
import { addDoc, collection, getDocs } from "firebase/firestore";

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
  status: "completed" | "pending";
  priority: "high" | "medium" | "low";
}

export const DashBoard = () => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
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
    fetchFirebaseTasks();
  }, []);

  const fetchFirebaseTasks = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc, index) => ({
        id: index + 1,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    } catch (error) {
      setError("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    setLoading(true);
    try {
      const task = {
        ...formData,
        id: tasks.length + 1,
        status: "pending",
      } as Task;

      await addDoc(collection(db, 'tasks'), formData);
      await fetchFirebaseTasks();
      
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        status: "pending",
      });
      setIsModalOpen(false);
    } catch (error) {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
          : task
      )
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sort === "asc") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const filteredTasks = sortedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTaskStats = () => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;

    return [
      { name: "Completed", value: completed },
      { name: "Pending", value: pending },
    ];
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUserInfo(null);
    setIsProfilePopupOpen(false);
  };

  const COLORS = ["#8B5CF6", "#3730A3"];

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
  
  if (error) return <div className="text-red-500">{error}</div>;
  if (!userInfo) return <Navigate to="/" replace />;

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} min-h-screen transition-all`}>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-purple-900 shadow-lg mb-4 p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Task Manager</h1>
        <div className="flex items-center space-x-4">
          <button
            className="p-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <BsMoonStars size={20} /> : <BsCloudSun size={20} />}
          </button>
          <img
            src={userInfo.photoURL || "/panda.png"}
            alt="User Avatar"
            className="w-12 h-12 rounded-full border-2 border-white cursor-pointer"
            onClick={() => setIsProfilePopupOpen(true)}
          />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <p className="font-semibold text-2xl">{userInfo.displayName ? `Hello, ${userInfo.displayName}! 👋` : `Hello, 👋` }</p>
        
        {/* Search and Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
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
              onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
              className="flex items-center space-x-1 text-gray-500 hover:text-purple-700 transition"
            >
              {sort === 'asc' ? <BsSortUp className="w-6 h-6" /> : <BsSortDown className="w-6 h-6" />}
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> New Task
          </button>
        </div>

        {/* Profile Popup */}
        {isProfilePopupOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsProfilePopupOpen(false)} 
            />
            <div className="fixed right-0 top-20 z-50 bg-white shadow-lg rounded-lg w-72 p-6">
              <div className="flex flex-col items-center">
                <img
                  src={userInfo.photoURL || "/panda.png"}
                  alt="User Avatar"
                  className="w-24 h-24 rounded-full border-2 border-gray-300 mb-4"
                />
                <p className="font-semibold text-xl">{userInfo.displayName}</p>
                <p className="text-gray-600">{userInfo.email}</p>
                <div className="mt-6">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Create Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative z-50 w-full max-w-lg mx-4">
              <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-xl`}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateTask();
                }} className="space-y-4">
                  <input
                    placeholder="Task Title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full p-2 rounded border ${darkMode && "bg-gray-700 border-gray-600"} focus:outline-none focus:border-purple-500`}
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full p-2 rounded border ${darkMode && "bg-gray-700 border-gray-600"} focus:outline-none focus:border-purple-500`}
                    rows={3}
                  />
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full p-2 rounded border ${darkMode && "bg-gray-700 border-gray-600"} focus:outline-none focus:border-purple-500`}
                  />
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({
                      ...formData,
                      priority: e.target.value as Task["priority"],
                    })}
                    className={`w-full p-2 rounded border ${darkMode && "bg-gray-700 border-gray-600"} focus:outline-none focus:border-purple-500`}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task List */}
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-lg p-6 max-h-[600px] overflow-y-auto`}
          >
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg flex justify-between items-center shadow-lg ${
                    darkMode
                      ? "bg-gray-800"
                      : "bg-white"
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p>{task.description}</p>
                    <small className="text-gray-500">
                      Due Date: {new Date(task.dueDate).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`p-2 rounded ${
                        task.status === "completed"
                          ? "bg-green-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 bg-red-600 text-white rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-lg p-6`}
          >
            <h2 className="text-xl font-semibold mb-4">Task Statistics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getTaskStats()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {getTaskStats().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};