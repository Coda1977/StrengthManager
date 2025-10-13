'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric);
    }
    
    // In production, you could send to analytics service
    // Example: sendToAnalytics(metric)
    
    // For now, just log important metrics
    const { name, value, rating } = metric;
    
    // Warn if metrics are poor
    if (rating === 'poor') {
      console.warn(`⚠️ Poor ${name}: ${value}`);
    }
  });

  return null;
}