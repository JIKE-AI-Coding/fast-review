import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ReviewPage from './pages/ReviewPage'
import ReaderPage from './pages/ReaderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/reader/:fileId" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App