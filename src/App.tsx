import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ReviewPage from './pages/ReviewPage'
import ReaderPage from './pages/ReaderPage'
import DirectoryBrowser from './pages/DirectoryBrowser'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/reader/:fileId" element={<ReaderPage />} />
        <Route path="/directory/:dirPath" element={<DirectoryBrowser />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App