import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';

import StudentShell from './components/StudentShell';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAppointments from './pages/student/StudentAppointments';
import StudentRecord from './pages/student/StudentRecord';
import StudentMessages from './pages/student/StudentMessages';

import StaffShell from './components/StaffShell';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffStudents from './pages/staff/StaffStudents';
import StaffStudentChart from './pages/staff/StaffStudentChart';
import StaffAppointments from './pages/staff/StaffAppointments';
import StaffMessages from './pages/staff/StaffMessages';
import StaffReports from './pages/staff/StaffReports';

import ProtectedRoute from './components/ProtectedRoute';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'student' ? '/portal' : '/clinic'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/portal"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="appointments" element={<StudentAppointments />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="record" element={<StudentRecord />} />
      </Route>

      <Route
        path="/clinic"
        element={
          <ProtectedRoute roles={['nurse', 'admin']}>
            <StaffShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboard />} />
        <Route path="students" element={<StaffStudents />} />
        <Route path="students/:id" element={<StaffStudentChart />} />
        <Route path="appointments" element={<StaffAppointments />} />
        <Route path="messages" element={<StaffMessages />} />
        <Route path="reports" element={<StaffReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
