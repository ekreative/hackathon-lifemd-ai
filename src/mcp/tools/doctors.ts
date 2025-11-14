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
  platformSpecialties: string[];
}

function formatDoctorShort(doc: Doctor): string {
  return `${doc.fullName} - ${doc.platformSpecialties.join(", ")}`;
}

function formatDoctorFull(doc: Doctor): string {
  return `Doctor: ${doc.fullName}
Status: ${doc.status}
Specialties: ${doc.platformSpecialties.join(", ")}
Active States: ${doc.activeStates.join(", ")}
Languages: ${doc.languages.join(", ")}
Email: ${doc.email}`;
}

function getActiveDoctors(doctors: Doctor[]): Doctor[] {
  return doctors.filter((d) => d.status === "active");
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
          "Search query: 'list', 'specialty:X', 'doctor:Name', or 'search:problem'"
        ),
    },
    outputSchema: {
      result: z.string(),
    },
  },
  handler: async ({ question }) => {
    const raw = fs.readFileSync(doctorsPath, "utf-8");
    const allDoctors: Doctor[] = JSON.parse(raw);
    const activeDoctors = getActiveDoctors(allDoctors);

    const q = question.trim().toLowerCase();

    // Case 1: List available doctors
    if (q === "list" || q.includes("show") || q.includes("available")) {
      const list = activeDoctors.slice(0, 5).map(formatDoctorShort).join("\n");
      const result = `Here are some of our available doctors:\n\n${list}\n\nWe have ${activeDoctors.length} active doctors total. Ask for more details about any specific doctor.`;
      return {
        content: [{ type: "text", text: result }],
        structuredContent: { result },
      };
    }

    // Case 2: Search by specialty
    if (q.startsWith("specialty:")) {
      const specialty = q.replace("specialty:", "").trim();
      const matches = activeDoctors.filter((doc) =>
        doc.platformSpecialties.some((s) => s.toLowerCase().includes(specialty))
      );

      if (matches.length === 0) {
        const result = `We have doctors with various specialties, but I couldn't find an exact match. Our specialties include: ${[
          ...new Set(activeDoctors.flatMap((d) => d.platformSpecialties)),
        ].join(", ")}`;
        return {
          content: [{ type: "text", text: result }],
          structuredContent: { result },
        };
      }

      const list = matches.map(formatDoctorShort).join("\n");
      const result = `Doctors with ${specialty} specialty:\n\n${list}`;
      return {
        content: [{ type: "text", text: result }],
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
          content: [{ type: "text", text: result }],
          structuredContent: { result },
        };
      }

      const result = formatDoctorFull(match);
      return {
        content: [{ type: "text", text: result }],
        structuredContent: { result },
      };
    }

    // Case 4: Search by health problem/specialty keywords
    if (q.startsWith("search:")) {
      const searchTerm = q.replace("search:", "").trim();
      const matches = activeDoctors.filter((doc) =>
        doc.platformSpecialties.some((s) =>
          s.toLowerCase().includes(searchTerm)
        )
      );

      if (matches.length > 0) {
        const specialties = [
          ...new Set(matches.flatMap((d) => d.platformSpecialties)),
        ];
        const list = matches.slice(0, 5).map(formatDoctorShort).join("\n");
        const result = `For your concern, these specialties might help: ${specialties.join(
          ", "
        )}\n\nRecommended doctors:\n\n${list}`;
        return {
          content: [{ type: "text", text: result }],
          structuredContent: { result },
        };
      }
    }

    // Default: general response
    const result = `I can help you find doctors on our platform. You can ask to see our available doctors, search by specialty, or get details about a specific doctor.`;
    return {
      content: [{ type: "text", text: result }],
      structuredContent: { result },
    };
  },
};

export default doctorsTool;
