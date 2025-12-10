
import { DataService } from "./dataService";
import { Topic } from "../types";

export const TelegramService = {
    sendMessage: async (chatId: string, text: string) => {
        const token = DataService.getTelegramToken();
        if (!token) {
            console.warn("Telegram Token not found");
            return false;
        }
        if (!chatId) {
            console.warn("Chat ID not found");
            return false;
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            return data.ok;
        } catch (error) {
            console.error("Telegram Error:", error);
            return false;
        }
    },

    sendTaskNotification: async (topic: Topic, type: 'new' | 'reminder' = 'new') => {
        const dept = DataService.getDepartments().find(d => d.id === topic.deptId);
        if (!dept || !dept.telegramChatId) return false;

        const icon = type === 'new' ? '🆕' : '⏰';
        const title = type === 'new' ? 'مهمة جديدة' : 'تذكير بمهمة';

        const message = `
<b>${icon} ${title}</b>

<b>العنوان:</b> ${topic.title}
<b>الأولوية:</b> ${topic.priority}
<b>المرسل:</b> ${topic.sender}
<b>موعد التسليم:</b> ${topic.dueDate}

<b>التفاصيل:</b>
${topic.details}

<i>يرجى المتابعة والإنجاز.</i>
        `;

        return await TelegramService.sendMessage(dept.telegramChatId, message);
    }
};
