/**
 * Standard Date & Time Utilities for Cyberspace Dashboard
 */

// 1. Formats a date string (YYYY-MM-DD) into "12 Mar 2026"
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// 2. Formats a time string (HH:mm:ss) into "HH:mm"
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // Handles both "YYYY-MM-DD HH:mm" and "HH:mm"
  const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
  const parts = timePart.split(':');
  if (parts.length < 2) return '';

  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');

  return `${hours}:${minutes}`;
};

// 3. Gets today's date in YYYY-MM-DD format (Safe for <input type="date">)
export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

// 4. Extracts the local YYYY-MM-DD part from a Date object without timezone shifting
export const toLocalISO = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};