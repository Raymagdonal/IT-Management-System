
import { AppData } from '../types';
import { INITIAL_DATA } from '../constants';

const STORAGE_KEY = 'it_marine_app_data';

export const storageService = {
  getData: (): AppData => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_DATA;
    try {
      const parsed = JSON.parse(stored);
      // Ensure migrations for new fields
      if (!parsed.shipInspections) parsed.shipInspections = [];
      return parsed;
    } catch {
      return INITIAL_DATA;
    }
  },
  
  saveData: (data: AppData): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  exportData: (data: AppData) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `it_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importData: async (file: File): Promise<AppData | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          // Basic validation
          if (parsed.workLogs && parsed.tickets && parsed.assets) {
            if (!parsed.shipInspections) parsed.shipInspections = [];
            resolve(parsed);
          } else {
            alert('Invalid backup file format');
            resolve(null);
          }
        } catch {
          alert('Failed to parse backup file');
          resolve(null);
        }
      };
      reader.readAsText(file);
    });
  }
};
