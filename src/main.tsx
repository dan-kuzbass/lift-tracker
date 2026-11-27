import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureSeedData } from './db/db'

const rootElement = document.getElementById('root')

async function bootstrap() {
  if (!rootElement) return
  try {
    await ensureSeedData()
  } catch (error) {
    console.error('Не удалось открыть локальную базу данных', error)
    rootElement.innerHTML =
      '<div style="min-height:100dvh;display:grid;place-items:center;padding:24px;background:#05070a;color:#f5f5f4;font-family:ui-sans-serif,system-ui,sans-serif;text-align:center"><div><div style="font-size:18px;font-weight:600;margin-bottom:8px">Не удалось открыть данные</div><p style="font-size:13px;line-height:1.6;color:#a1a1aa;max-width:300px;margin:0">Проверьте, что браузер разрешает локальное хранилище, и перезагрузите страницу.</p></div></div>'
    return
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
