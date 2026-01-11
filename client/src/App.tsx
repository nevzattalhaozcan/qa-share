import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleSelect from "./pages/RoleSelect";
import TestCases from "./pages/TestCases";
import CreateTestCase from "./pages/CreateTestCase";
import TestCaseDetail from "./pages/TestCaseDetail";
import { DataProvider } from "./context/DataContext";
import Bugs from "./pages/Bugs";
import CreateBug from "./pages/CreateBug";
import BugDetail from "./pages/BugDetail";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import CreateProject from "./pages/CreateProject";
import ProjectSettings from "./pages/ProjectSettings";
import EditTestCase from "./pages/EditTestCase";
import EditBug from "./pages/EditBug";
import Tasks from "./pages/Tasks";
import CreateTask from "./pages/CreateTask";
import EditTask from "./pages/EditTask";
import TaskDetail from "./pages/TaskDetail";

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
};

const router = createHashRouter([
  {
    path: "/role-select",
    element: <RoleSelect />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/create-project",
        element: <CreateProject />,
      },
      {
        path: "/projects/:id/settings",
        element: <ProjectSettings />,
      },
      {
        path: "/tests",
        element: <TestCases />,
      },
      {
        path: "/tests/create",
        element: <CreateTestCase />,
      },
      {
        path: "/tests/:id",
        element: <TestCaseDetail />,
      },
      {
        path: "/tests/:id/edit",
        element: <EditTestCase />,
      },
      {
        path: "/bugs",
        element: <Bugs />,
      },
      {
        path: "/bugs/create",
        element: <CreateBug />,
      },
      {
        path: "/bugs/:id",
        element: <BugDetail />,
      },
      {
        path: "/bugs/:id/edit",
        element: <EditBug />,
      },
      {
        path: "/tasks",
        element: <Tasks />,
      },
      {
        path: "/tasks/create",
        element: <CreateTask />,
      },
      {
        path: "/tasks/:id",
        element: <TaskDetail />,
      },
      {
        path: "/tasks/:id/edit",
        element: <EditTask />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
