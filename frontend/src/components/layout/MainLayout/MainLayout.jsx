import { Outlet } from 'react-router-dom'
import Header from '../Header'
import Sidebar from '../Sidebar'
import Chatbot from '../../Chatbot/Chatbot'
import styles from './MainLayout.module.css'

function MainLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <Chatbot />
    </div>
  )
}

export default MainLayout
