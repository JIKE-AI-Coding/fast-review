import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ReviewPage from './pages/ReviewPage'
import ReaderPage from './pages/ReaderPage'
import DirectoryBrowser from './pages/DirectoryBrowser'
import StatsPage from './pages/StatsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/reader/:fileId" element={<ReaderPage />} />
        <Route path="/directory/:dirPath" element={<DirectoryBrowser />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App