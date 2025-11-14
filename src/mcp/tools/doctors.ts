import { z } from "zod/v3";
import type { ToolRegistration } from "./types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const doctorsPath = path.resolve(__dirname, "../../../assets/doctors.json");

const systemPrompt = `You are the LifeMD staff assistant. You can provide information about doctors, their specialties, status, and contact details. If a patient asks about a doctor, search the staff database and reply with relevant information.`;

// Допоміжна функція для отримання короткого списку лікарів
function getShortDoctorList(doctors: any[], count: number = 5) {
    return doctors.slice(0, count).map((doc: any) => `${doc.fullName} (${doc.platformSpecialties.join(", ")})`).join("\n");
}

// Допоміжна функція для отримання списку спеціальностей
function getSpecialties(doctors: any[]) {
    const specialties = new Set<string>();
    doctors.forEach((doc: any) => {
        doc.platformSpecialties.forEach((s: string) => specialties.add(s));
    });
    return Array.from(specialties);
}

const doctorsTool: ToolRegistration = {
    name: "doctor_info",
    schema: {
        title: "Doctor Information",
        description: systemPrompt,
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: async ({ question }) => {
        const raw = fs.readFileSync(doctorsPath, "utf-8");
        const doctors = JSON.parse(raw);
        const q = question.trim().toLowerCase();

        // 1. Якщо запит загальний (про лікарів або запис)
        if (/doctor|appointment|лікар|запис|see a doctor|find a doctor|staff/.test(q)) {
            const shortList = getShortDoctorList(doctors);
            return {
                content: [{ type: "text", text: `Ось короткий список доступних лікарів:\n${shortList}\nДля детальнішої інформації про конкретного лікаря, напишіть його ім'я.` }],
                structuredContent: { answer: `Short doctor list: ${shortList}` },
            };
        }

        // 2. Якщо запит про проблему (наприклад, "I have a heart issue")
        const specialties = getSpecialties(doctors);
        const matchedSpecialties = specialties.filter(s => q.includes(s.toLowerCase()));
        if (matchedSpecialties.length > 0) {
            const matchedDoctors = doctors.filter((doc: any) =>
                doc.platformSpecialties.some((s: string) => matchedSpecialties.includes(s))
            );
            const doctorList = getShortDoctorList(matchedDoctors);
            return {
                content: [{ type: "text", text: `З вашою проблемою можуть допомогти лікарі зі спеціальностями: ${matchedSpecialties.join(", ")}.\nОсь рекомендовані лікарі:\n${doctorList}` }],
                structuredContent: { answer: `Recommended doctors: ${doctorList}` },
            };
        }

        // 3. Якщо запит про конкретного лікаря
        const matchedDoctors = doctors.filter((doc: any) =>
            doc.name.toLowerCase() === q ||
            doc.fullName.toLowerCase() === q
        );
        if (matchedDoctors.length > 0) {
            const doc = matchedDoctors[0];
            const answer = `Доктор: ${doc.fullName} (${doc.name})\nСтатус: ${doc.status}\nСпеціальності: ${doc.platformSpecialties.join(", ")}\nШтати: ${doc.activeStates.join(", ")}\nEmail: ${doc.email}`;
            return {
                content: [{ type: "text", text: answer }],
                structuredContent: { answer },
            };
        }

        // Якщо нічого не знайдено
        return {
            content: [{ type: "text", text: `Не знайдено лікаря або спеціальності за запитом: ${question}` }],
            structuredContent: { answer: `No doctor or specialty found for query: ${question}` },
        };
    },
};

export default doctorsTool;
