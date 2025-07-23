import { Routes, Route } from 'react-router-dom';
import ChannelList from './pages/ChannelList';
import ChannelDetailEdit from './pages/ChannelDetailEdit';
import ChannelNew from './pages/ChannelNew';
import './App.css'; // 保持原有的 CSS 引入

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/channels" element={<ChannelList />} />
        <Route path="/channels/new" element={<ChannelNew />} />
        <Route path="/channels/:channelId" element={<ChannelDetailEdit />} />
        <Route path="/channels/:channelId/edit" element={<ChannelDetailEdit />} />
        {/* 可以添加一個預設路由，例如導向 /channels */}
        <Route path="/" element={<ChannelList />} />
      </Routes>
    </div>
  );
}

export default App
