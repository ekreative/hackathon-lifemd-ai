import { z } from "zod/v3";
import type { ToolRegistration } from "./types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

const doctorsPath = path.resolve(__dirname, "../../../assets/doctors.json");

const systemPrompt = `You are the LifeMD staff assistant. Use this tool to search our doctor database when:
1. User asks about OUR doctors, OUR platform, OUR website, or wants to book an appointment
2. User asks for specific doctor details by name
3. User explicitly wants to see our available doctors

DO NOT use this tool if:
- User asks general questions about medical specialties (just answer conversationally)
- User doesn't specifically mention our platform/doctors

Input should be one of:
- "list" - show available doctors for appointments
- "specialty:CardioLogy" - find doctors by specialty
- "doctor:Shaun Murphy" - get specific doctor details
- "search:heart problem" - find relevant doctors for a health issue`;

interface Doctor {
  _id: string;
  status: string;
  activeStates: string[];
  email: string;
  userType: { name: string; shortCode: string };
  profileImage: string;
  languages: string[];
  name: string;
  fullName: string;
  schedule?: string[];
  programs?: string[];
}

// Keywords for programs
const programKeywords = [
  { key: "womens_health_tool", words: ["women", "gynecology", "female", "cycle", "postpartum", "womens health", "gynecology"] },
  { key: "weight_management_tool", words: ["weight", "diet", "nutrition", "obesity", "food", "weight management", "diet", "weight", "nutrition"] },
  { key: "mental_health_tool", words: ["mental", "psychology", "psychiatry", "stress", "anxiety", "sleep", "psych", "mental health", "psychologist", "psychiatrist", "stress", "depression"] }
];

function formatDoctorShort(doc: Doctor): string {
  return `${doc.fullName} (${doc.programs?.join(", ") ?? "No program"})`;
}

function formatDoctorFull(doc: Doctor): string {
  let scheduleText = "No available times.";
  if (doc.schedule && doc.schedule.length > 0) {
    scheduleText = doc.schedule.map((s) => new Date(s).toLocaleString()).join(", ");
  }
  return `Doctor: ${doc.fullName}
Status: ${doc.status}
Programs: ${doc.programs?.join(", ") ?? "No program"}
Active States: ${doc.activeStates.join(", ")}
Languages: ${doc.languages.join(", ")}
Email: ${doc.email}
Available times: ${scheduleText}`;
}

function getActiveDoctors(doctors: Doctor[]): Doctor[] {
  return doctors.filter((d) => d.status === "active");
}

function formatScheduleSummary(doctors: Doctor[]): string {
  return doctors
    .map((doc) => {
      const nextSlot = doc.schedule && doc.schedule.length > 0 ? new Date(doc.schedule[0]).toLocaleString() : "No slots";
      return `${doc.fullName}: ${nextSlot}`;
    })
    .join("\n");
}

const doctorsTool: ToolRegistration = {
  name: "doctor_info",
  schema: {
    title: "Doctor Information",
    description: systemPrompt,
    inputSchema: {
      question: z
        .string()
        .describe(
          "Search query: 'list', 'doctor:Name', 'search:problem', 'schedule:Name', or 'schedules'"
        ),
    },
    outputSchema: {
      result: z.string(),
    },
  },
  handler: async ({ question }: { question: string }) => {
    const raw = fs.readFileSync(doctorsPath, "utf-8");
    const allDoctors: Doctor[] = JSON.parse(raw);
    const activeDoctors = getActiveDoctors(allDoctors);

    const q = question.trim().toLowerCase();

    // Check program
    for (const program of programKeywords) {
      if (program.words.some(w => q.includes(w))) {
        const matches = activeDoctors.filter(doc => doc.programs && doc.programs.includes(program.key));
        if (matches.length > 0) {
          const list = matches.map(formatDoctorShort).join("\n");
          const result = `Here are doctors who can help with this issue:\n${list}`;
          return {
            content: [{ type: "text" as const, text: result }],
            structuredContent: { result },
          };
        } else {
          const result = `Currently, there are no doctors specializing in this program.`;
          return {
            content: [{ type: "text" as const, text: result }],
            structuredContent: { result },
          };
        }
      }
    }

    // Keywords for schedule/availability queries
    const scheduleKeywords = [
      "schedule", "availability", "available", "appointment", "sign up", "book", "next time", "when can", "when is", "when are", "times", "slots"
    ];

    // Helper: find doctor by name (fuzzy)
    function findDoctorByName(query: string): Doctor | undefined {
      return allDoctors.find(
        (doc) =>
          doc.fullName.toLowerCase().includes(query) ||
          doc.name.toLowerCase().includes(query)
      );
    }

    // 1. If query is about all doctors' schedules
    if (q === "schedules" || q.includes("all schedules") || q.includes("all availability") || q.includes("all appointment")) {
      const result = `Doctors' next available times:\n${formatScheduleSummary(activeDoctors)}`;
      return {
        content: [{ type: "text" as const, text: result }],
        structuredContent: { result },
      };
    }

    // 2. If query is about a specific doctor's schedule (flexible matching)
    for (const doc of allDoctors) {
      const nameLower = doc.fullName.toLowerCase();
      if (q.includes(nameLower) && scheduleKeywords.some(k => q.includes(k))) {
        let scheduleText = "No available times.";
        if (doc.schedule && doc.schedule.length > 0) {
          scheduleText = doc.schedule.map((s) => new Date(s).toLocaleString()).join(", ");
        }
        const earliest = doc.schedule && doc.schedule.length > 0 ? new Date(doc.schedule[0]).toLocaleString() : "No slots";
        const result = `Doctor ${doc.fullName} is available at: ${scheduleText}\nEarliest slot: ${earliest}`;
        return {
          content: [{ type: "text" as const, text: result }],
          structuredContent: { result },
        };
      }
    }
    // Also support: 'schedule:Name', 'availability for Name', 'next available for Name', 'available times for Name'
    if (q.startsWith("schedule:") || q.includes("availability for") || q.includes("next available for") || q.includes("available times for")) {
      let name = q.replace("schedule:", "").replace("availability for", "").replace("next available for", "").replace("available times for", "").trim();
      const match = findDoctorByName(name);
      if (!match) {
        const result = `I couldn't find a doctor with that name. Try asking to see our list of available doctors.`;
        return {
          content: [{ type: "text" as const, text: result }],
          structuredContent: { result },
        };
      }
      let scheduleText = "No available times.";
      if (match.schedule && match.schedule.length > 0) {
        scheduleText = match.schedule.map((s) => new Date(s).toLocaleString()).join(", ");
      }
      const earliest = match.schedule && match.schedule.length > 0 ? new Date(match.schedule[0]).toLocaleString() : "No slots";
      const result = `Doctor ${match.fullName} is available at: ${scheduleText}\nEarliest slot: ${earliest}`;
      return {
        content: [{ type: "text" as const, text: result }],
        structuredContent: { result },
      };
    }

    // Case 1: List available doctors
    if (q === "list" || q.includes("show") || q.includes("available")) {
      const list = activeDoctors.slice(0, 5).map(formatDoctorShort).join("\n");
      const result = `Here are some of our available doctors:\n\n${list}\n\nWe have ${activeDoctors.length} active doctors total. Ask for more details about any specific doctor.`;
      return {
        content: [{ type: "text" as const, text: result }],
        structuredContent: { result },
      };
    }

    // Case 3: Get specific doctor details
    if (q.startsWith("doctor:")) {
      const name = q.replace("doctor:", "").trim();
      const match = allDoctors.find(
        (doc) =>
          doc.fullName.toLowerCase().includes(name) ||
          doc.name.toLowerCase().includes(name)
      );

      if (!match) {
        const result = `I couldn't find a doctor with that name. Try asking to see our list of available doctors.`;
        return {
          content: [{ type: "text" as const, text: result }],
          structuredContent: { result },
        };
      }

      const result = formatDoctorFull(match);
      return {
        content: [{ type: "text" as const, text: result }],
        structuredContent: { result },
      };
    }

    // Default: general response
    const result = `I can help you find doctors on our platform. You can ask to see our available doctors or get details about a specific doctor.`;
    return {
      content: [{ type: "text" as const, text: result }],
      structuredContent: { result },
    };
  },
};

export default doctorsTool;
