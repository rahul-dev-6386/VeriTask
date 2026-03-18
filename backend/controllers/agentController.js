import { TodoModel } from "../../db.js";
import { genAI } from "../config/env.js";

async function agentManager(req, res) {
    try {
        const { prompt } = req.body;
        const userId = req.userId;

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        // Fetch user's current tasks for context
        const userTodos = await TodoModel.find({ userId });
        const taskContext = userTodos.map(t =>
            `- "${t.title}"${t.description ? ` (${t.description})` : ''} [${t.done ? 'done' : 'pending'}]${t.dueDate ? ` due: ${new Date(t.dueDate).toLocaleDateString()}` : ''}`
        ).join('\n');

        const systemPrompt = `You are a helpful task management assistant. The user's current tasks are:\n${taskContext || 'No tasks yet.'}\n\nUser says: ${prompt}`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["add", "delete", "update", "chat"] },
                        taskTitle: { type: "string" },
                        taskDescription: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        replyText: { type: "string" }
                    },
                    required: ["action", "replyText"]
                }
            }
        });

        const result = await model.generateContent(systemPrompt);
        const aiResponseText = result.response.text();
        const structuredData = JSON.parse(aiResponseText);

        res.json({
            message: "Agent processed successfully",
            data: structuredData
        });
    } catch (err) {
        console.error("Agent Error:", err);
        res.status(500).json({ message: "Error in agent processing" });
    }
}

export { agentManager };
