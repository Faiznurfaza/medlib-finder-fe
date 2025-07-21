import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={enUS}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to="/med" replace />} />
          <Route path='/med' element={<App />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
)