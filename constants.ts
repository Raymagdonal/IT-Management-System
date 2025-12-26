
import { TaskStatus, TicketType, LocationCategory, AppData } from './types';

export const INITIAL_DATA: AppData = {
  workLogs: [
    {
      id: 'wl-1',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      staffName: 'มนชัย เจริญอินทร์',
      location: 'ท่าเรือสาทร',
      taskDescription: 'ตรวจสอบความเรียบร้อยระบบเครือข่ายและเครื่องขายตั๋วอัตโนมัติ',
      status: TaskStatus.COMPLETED
    }
  ],
  tickets: [
    {
      id: 'tk-1',
      type: TicketType.REPAIR,
      subject: 'เราเตอร์ขัดข้อง - เรือด่วนลำที่ 105',
      details: 'สัญญาณ Wi-Fi หลุดบ่อยครั้งในระหว่างเดินทาง คาดว่าเกิดจากสายสัญญาณหลวม',
      location: 'เรือด่วนลำที่ 105',
      status: TaskStatus.IN_PROGRESS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  assets: [
    {
      id: 'as-1',
      name: 'เซิร์ฟเวอร์หลัก CPX-DATA-01',
      serialNumber: 'CPX-HQ-SV9921',
      category: 'เซิร์ฟเวอร์',
      locationCategory: LocationCategory.OFFICE,
      locationName: 'ห้องไอที ชั้น 2 สำนักงานใหญ่',
      status: 'Active',
      lastChecked: new Date().toISOString().split('T')[0],
      // Fix: Added missing staffName property as required by Asset interface
      staffName: 'มนชัย เจริญอินทร์'
    },
    {
      id: 'as-2',
      name: 'เครื่องรับสัญญาณดาวเทียม Marine-V3',
      serialNumber: 'SAT-BOAT-002',
      category: 'อุปกรณ์สื่อสาร',
      locationCategory: LocationCategory.SHIP,
      locationName: 'เรือด่วนลำที่ 202',
      status: 'Active',
      lastChecked: new Date().toISOString().split('T')[0],
      // Fix: Added missing staffName property as required by Asset interface
      staffName: 'มนชัย เจริญอินทร์'
    }
  ],
  shipInspections: []
};
