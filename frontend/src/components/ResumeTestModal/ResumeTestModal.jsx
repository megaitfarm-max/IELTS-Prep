import { useState } from 'react';
import styles from './ResumeTestModal.module.css';

function ResumeTestModal({ isOpen, onResume, onStartNew, testInfo }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <span className={styles.icon}>📝</span>
          <h2>Welcome Back!</h2>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.mainText}>
            You have an incomplete <strong>{testInfo?.moduleName || 'mock'}</strong> test.
          </p>
          
          <div className={styles.progressInfo}>
            <div className={styles.progressItem}>
              <span className={styles.label}>Module:</span>
              <span className={styles.value}>{testInfo?.moduleName || 'Unknown'}</span>
            </div>
            <div className={styles.progressItem}>
              <span className={styles.label}>Progress:</span>
              <span className={styles.value}>{testInfo?.progress || '0%'}</span>
            </div>
            <div className={styles.progressItem}>
              <span className={styles.label}>Time Left:</span>
              <span className={styles.value}>{testInfo?.timeLeft || 'N/A'}</span>
            </div>
          </div>
          
          <p className={styles.subText}>
            Would you like to continue where you left off?
          </p>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            onClick={onResume} 
            className={`${styles.button} ${styles.primaryButton}`}
          >
            <span className={styles.buttonIcon}>▶️</span>
            Resume Test
          </button>
          <button 
            onClick={onStartNew} 
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            <span className={styles.buttonIcon}>🔄</span>
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeTestModal;
