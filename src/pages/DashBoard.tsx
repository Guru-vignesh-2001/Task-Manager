import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { BsMoonStars, BsCloudSun, BsSearch, BsSortUp, BsSortDown } from "react-icons/bs";
import { FaCheck, FaTrash, FaPlus } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { db } from "../fire_base/firebaseConfig";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";

const dummyDataTask: Task[] = [
  {
    id: 1,
    title: "Finish React project",
    description: "Complete the tasks management app with drag and drop functionality.",
    dueDate: "2025-01-20",
    status: "pending",
    priority: "high",
  },
  {
    id: 2,
    title: "Update resume",
    description: "Revise and update the resume with recent job experience.",
    dueDate: "2025-01-15",
    status: "pending",
    priority: "medium",
  },
  {
    id: 3,
    title: "Learn Django REST API",
    description: "Go through tutorials and create a simple Django REST API.",
    dueDate: "2025-01-25",
    status: "pending",
    priority: "medium",
  },
];

const dummyDataCompletedTask: Task[] = [
  {
    id: 4,
    title: "Complete Java certification",
    description: "Finish the Java backend development course.",
    dueDate: "2024-12-01",
    status: "completed",
    priority: "high",
  },
  {
    id: 5,
    title: "Build personal website",
    description: "Create a portfolio website with React and TypeScript.",
    dueDate: "2024-12-10",
    status: "completed",
    priority: "low",
  },
];

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
  const [completedTask, setCompletedTask] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [taskDocIds, setTaskDocIds] = useState<{ [key: number]: string }>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  console.log(selectedTask);
  
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
      const userData: User = JSON.parse(user);
      setUserInfo(userData);
    } else {
      window.location.href=('/')
    }
    fetchFirebaseTasks();
  }, []);

  const fetchFirebaseTasks = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const taskDocs: { [key: number]: string } = {};
      
      const tasksData = querySnapshot.docs.map((doc, index) => {
        const taskId = index + 1;
        taskDocs[taskId] = doc.id;
        return {
          id: taskId,
          ...doc.data()
        };
      }) as Task[];

      setTaskDocIds(taskDocs);
      const todoTasks = tasksData.filter((task) => task.status !== 'completed');
      const completedTasks = tasksData.filter((task) => task.status === 'completed');

      setTasks(todoTasks);
      setCompletedTask(completedTasks);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError("Failed to fetch tasks.");
    }
  };

  const handleCreateTask = async () => {
    setLoading(true);
    try {
      const task = {
        ...formData,
        id: tasks.length + completedTask.length + 1,
        status: "pending",
      } as Task;

      await addDoc(collection(db, 'tasks'), task);
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

  const handleDeleteTask = async (taskId: number) => {
    setLoading(true);
    try {
      const docId = taskDocIds[taskId];
      if (!docId) {
        throw new Error("Task document ID not found");
      }

      await deleteDoc(doc(db, 'tasks', docId));
      await fetchFirebaseTasks();
    } catch (error) {
      setError("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: number) => {
    setLoading(true);
    try {
      const docId = taskDocIds[taskId];
      if (!docId) {
        throw new Error("Task document ID not found");
      }

      const task = [...tasks, ...completedTask].find(t => t.id === taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      const newStatus = task.status === "completed" ? "pending" : "completed";
      
      await updateDoc(doc(db, 'tasks', docId), {
        status: newStatus
      });      

      setSelectedTask(null)
      await fetchFirebaseTasks();
    } catch (error) {
      setError("Failed to update task status");
    } finally {
      setLoading(false);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sort === "asc") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const filteredTasks = sortedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase())
  );

  const getTaskStats = () => {
    const completed = completedTask.length;
    const pending = tasks.length;

    return [
      { name: "Completed", value: completed },
      { name: "Pending", value: pending },
    ];
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href=('/')
  };

  const handlePriorityChange = async (taskId: number, newPriority: Task["priority"]) => {
    setLoading(true);
    try {
      const docId = taskDocIds[taskId];
      if (!docId) {
        throw new Error("Task document ID not found");
      }

      await updateDoc(doc(db, 'tasks', docId), {
        priority: newPriority
      });

      await fetchFirebaseTasks();
    } catch (error) {
      setError("Failed to update task priority");
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (dueDate: string | undefined) => {
    if (!dueDate) return "No Due Date"; // Handle the case where dueDate is undefined or missing
    
    const currentDate = new Date();
    const dueDateObj = new Date(dueDate);
  
    // Check if the dueDate is a valid date
    if (isNaN(dueDateObj.getTime())) return "Invalid Due Date";
  
    dueDateObj.setHours(23, 59, 59, 999); // Set the due date to the end of the day
  
    const timeDiff = dueDateObj.getTime() - currentDate.getTime();
    
    if (timeDiff < 0) return "Expired"; // If the due date has passed, return "Expired"
    
    const daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24)); // Calculate the number of days remaining
    const hoursLeft = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600)); // Calculate the hours remaining
    const minutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60)); // Calculate the minutes remaining
  
    // Format the remaining time string
    return `${daysLeft}d ${hoursLeft}h ${minutesLeft}m`;
  };  

  const COLORS = ["#8B5CF6", "#3730A3"];

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
  
  if (error) return <div className="text-red-500">{error}</div>;  
  if (!userInfo) return <Navigate to="/" replace />;
  const selectedTaskRemainingDate = calculateTimeRemaining(selectedTask?.dueDate)

  const getPriority = (priority: string) => {
    if(priority === 'high') return 'border-red-500'
    if(priority === 'medium') return 'border-yellow-500'
    if(priority === 'low') return 'border-green-500'
  }

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} min-h-screen transition-all`}>      
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
        {/* Search and Controls */}
        <div className="flex justify-between items-center mb-6">

          <p className="font-semibold text-2xl">{userInfo.displayName ? `Hello, ${userInfo.displayName}! 👋` : `Hello, 👋` }</p>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
          

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <FaPlus className="mr-2" /> New Task
            </button>
          
          </div>
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

        {/* select the task */}
        {selectedTask && <div className="fixed inset-0 flex items-center justify-center z-50">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setSelectedTask(null)}
            />
            <div className="relative z-50 w-full max-w-lg mx-4">
              <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-6 shadow-xl space-y-4`}>
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-semibold text-gray-600">{selectedTask.title}</h2>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-center">{selectedTask.description}</p>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-thin">Due Date:</span>
                    <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-thin">Priority:</span>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => handlePriorityChange(selectedTask.id, e.target.value as Task["priority"])}
                      className={`p-2 rounded border ${
                        darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"
                      } focus:outline-none focus:border-purple-500`}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                {selectedTask.status === 'pending' && <p className="text-center py-2 text-xl font-semibold">{selectedTaskRemainingDate}</p>}

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => toggleTaskStatus(selectedTask.id)}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      selectedTask.status === "completed"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white`}
                  >
                    <FaCheck className="mr-2" />
                    {selectedTask.status === "completed" ? "Mark as Todo" : "Mark as Complete"}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleDeleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    Delete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task List */}
          <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-lg p-6 max-h-[600px]`}
          >
            <h2 className="text-xl font-semibold mb-4">To Do</h2>
            <div className="max-h-[480px] overflow-y-auto">
            <div className="flex flex-col items-center justify-center w-full min-h-[200px]">
            {tasks.length > 0 ? (
              filteredTasks.map((task) => {
                // Get the remaining time using the function
                const timeRemaining = calculateTimeRemaining(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className={`w-[95%] max-w-[600px] p-4 rounded-lg flex justify-between items-center shadow-lg transition-transform ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } 
                    border-l-2 ${getPriority(task.priority)} 
                    hover:scale-105 mb-4`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{task.title}</h3>
                      <p>{task.description}</p>
                      <small className="text-gray-500">
                        Due Date: {new Date(task.dueDate).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="absolute top-2 right-4 text-sm text-gray-500">
                      {timeRemaining}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex justify-center items-center w-full h-[200px]">
                <p className="text-center text-gray-500">No tasks added yet</p>
              </div>
            )}
            </div>

            </div>
          </div>


          {/* Pie Chart */}
          <div
            className={`relative ${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-lg p-6 flex justify-center items-center`}
          >
            <h2 className="absolute top-6 left-6 text-xl font-semibold mb-4">
              Task Statistics
            </h2>

            {getTaskStats().length === 0 ? (
              <div className="text-center text-gray-500">
                <p>No tasks available. Add tasks to see statistics.</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <div
            className={`w-full ${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-lg p-6`}
          >
            <h2 className="text-xl font-semibold mb-4">Completed</h2>
            <div className={`w-full max-h-[600px] ${darkMode ? 'bg-gray-800' : 'bg-white' } rounded-lg overflow-y-auto`}>
              
            {completedTask && completedTask.length > 0 ? (
              completedTask.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-lg flex justify-between items-center shadow-lg ${
                    darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
                  }`}
                >
                  {/* Task Details */}
                  <div>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p>{task.description}</p>
                    <small className="text-gray-500">
                      Due Date: {new Date(task.dueDate).toLocaleDateString()}
                    </small>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {/* Toggle Status Button */}
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`p-2 rounded ${
                        task.status === "completed"
                          ? "bg-green-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                      aria-label="Toggle Task Status"
                    >
                      <FaCheck />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 bg-red-600 text-white rounded"
                      aria-label="Delete Task"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Yet to Complete the Task</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};