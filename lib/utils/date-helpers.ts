/**
 * Date utility functions for the email system
 * Provides consistent date calculations across the application
 */

/**
 * Calculate the next Monday from today
 * @returns Date object set to the next Monday at midnight
 */
export function getNextMonday(): Date {
  const nextMonday = new Date();
  const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

/**
 * Get today's date at midnight (00:00:00)
 * Useful for date comparisons without time components
 * @returns Date object set to today at midnight
 */
export function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Format a date for display in emails
 * @param date - The date to format
 * @returns Formatted string like "Monday, October 13"
 */
export function formatEmailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}