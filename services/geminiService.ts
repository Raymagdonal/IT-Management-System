
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

/**
 * Generates a smart summary of IT status using Gemini.
 * Uses systemInstruction as per @google/genai guidelines.
 */
export const getSmartSummary = async (data: AppData): Promise<string> => {
  // Always use the named parameter for apiKey and fetch from environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contentBody = `
    รายการแจ้งซ่อม/จัดซื้อปัจจุบัน: ${data.tickets.length} รายการ (กำลังดำเนินการ ${data.tickets.filter(t => t.status !== 'Completed').length} รายการ)
    งานล่าสุด: ${data.workLogs.slice(0, 5).map(l => l.taskDescription).join(', ')}
    อุปกรณ์ทั้งหมด: ${data.assets.length} รายการ
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contentBody,
      config: {
        systemInstruction: "คุณเป็นผู้จัดการไอทีผู้เชี่ยวชาญ โปรดวิเคราะห์ข้อมูลแผนกไอทีนี้และสรุปสั้นๆ (3-4 ประโยค) เกี่ยวกับสถานะปัจจุบัน พร้อมระบุลำดับความสำคัญเร่งด่วน โดยตอบเป็น \"ภาษาไทย\" เท่านั้น เน้นการสรุปที่ชัดเจนเรื่องความพร้อมในการปฏิบัติงานของเรือและสำนักงาน",
      },
    });
    // Directly access the .text property as per guidelines
    return response.text || "ไม่สามารถสร้างสรุปได้ในขณะนี้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อ AI";
  }
};
