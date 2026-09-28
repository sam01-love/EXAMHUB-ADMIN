import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Questions from './pages/Questions'
import QuestionForm from './pages/QuestionForm'
import Students from './pages/Students'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="questions" element={<Questions />} />
            <Route path="questions/new" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="students" element={<Students />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}
