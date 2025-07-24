import { Routes, Route } from 'react-router-dom';
import ChannelList from './pages/ChannelList';
import ChannelDetailEdit from './pages/ChannelDetailEdit';
import ChannelNew from './pages/ChannelNew';
import HomePage from './pages/HomePage'; // 引入 HomePage
import './App.css'; // 保持原有的 CSS 引入

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/channels" element={<ChannelList />} />
        <Route path="/channels/new" element={<ChannelNew />} />
        <Route path="/channels/:channelId" element={<ChannelDetailEdit />} />
        <Route path="/channels/:channelId/edit" element={<ChannelDetailEdit />} />
        {/* 將根路徑指向 HomePage */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App
