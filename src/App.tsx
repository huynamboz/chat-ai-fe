import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ChatDetailPage from "@/pages/chat-detail";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import { ProtectedRoute } from "@/components/protected-route";
import { PublicRoute } from "@/components/public-route";

function App() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <IndexPage />
          </ProtectedRoute>
        }
        path="/"
      />
      <Route
        element={
          <ProtectedRoute>
            <ChatDetailPage />
          </ProtectedRoute>
        }
        path="/chats/:id"
      />
      <Route
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
        path="/login"
      />
      <Route
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
        path="/register"
      />
    </Routes>
  );
}

export default App;
