import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ChatDetailPage from "@/pages/chat-detail";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ChatDetailPage />} path="/chats/:id" />
    </Routes>
  );
}

export default App;
