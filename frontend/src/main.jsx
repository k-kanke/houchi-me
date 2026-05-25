import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode は Three.js の二重初期化を避けるためオフ（Milestone A）
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
