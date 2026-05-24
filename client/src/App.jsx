import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AdminChallengesPage from './pages/AdminChallengesPage.jsx';
import AdminCoursesPage from './pages/AdminCoursesPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminNotesPage from './pages/AdminNotesPage.jsx';
import ChallengePage from './pages/ChallengePage.jsx';
import CompilerPage from './pages/CompilerPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import PracticePage from './pages/PracticePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-lg">Loading authentication...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/challenges" element={<ChallengePage />} />
        <Route path="/compiler" element={<CompilerPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/courses" element={<AdminCoursesPage />} />
          <Route path="/admin/notes" element={<AdminNotesPage />} />
          <Route path="/admin/challenges" element={<AdminChallengesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
