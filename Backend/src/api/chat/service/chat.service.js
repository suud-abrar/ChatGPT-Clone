// import db from "../../../db/db.config.js";
import prisma from "../../../db/prisma.js";
import { GoogleGenAI } from "@google/genai";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getRecentConversation = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;
  // const [rows] = await db.execute(
  //   `SELECT id, role, content, created_at FROM conversations ORDER BY id DESC LIMIT ${limit}`,
  // );
  const rows = await prisma.conversation.findMany({
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
    orderBy: {
      id: "desc",
    },
    take: limit,
  });
  return rows.reverse();
};
const generateAssistantAnswer = async ({ historyRows, question }) => {
  console.log(question);
  try {
    // format history of Gemini startChat
    const formattedHistory = historyRows.map((row) => ({
      role: row.role === "assistant" ? "model" : "user",
      parts: [{ text: row.content }],
    }));
    const chat = await geminiClient.chats.create({
      model: GEMINI_MODEL,
      history: formattedHistory,
    });

    const result = await chat.sendMessage({ message: question });
    return {
      text: result.text,
      totalTokens: result.usageMetadata.totalTokenCount,
    };
  } catch (error) {
    throw error;
  }
};

// const getMessageById = async (messageId) => {
//   const [row] = await db.execute(
//     "SELECT id,role, content, token_count, created_at FROM conversations WHERE id=? LIMIT 1",
//     [messageId],
//   );
//   if (!row[0]) return null;
//   return {
//     id: row[0].id,
//     role: row[0].role,
//     content: row[0].content,
//     tokenCount: row[0].token_count,
//     createdAt: row[0].createdAt,
//   };
// };


const getMessageById = async (messageId) => {
  const row = await prisma.conversation.findUnique({
    where: {
      id: BigInt(messageId),
    },
    select: {
      id: true,
      role: true,
      content: true,
      tokenCount: true,
      createdAt: true,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    role: row.role,
    content: row.content,
    tokenCount: row.tokenCount,
    createdAt: row.createdAt,
  };
};

export async function createConversationService(question) {
  try {
    //validation
    if (!question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // get recent conversations
    const historyRows = await getRecentConversation();

    // insert new conversations
    // const [result] = await db.execute(
    //   "INSERT INTO conversations (content,role) VALUE(?,'user')",
    //   [question],
    // );
    const result = await prisma.conversation.create({
      data: {
        content: question,
        role: "user",
      },
    });
    
    const { text, totalTokens } = await generateAssistantAnswer({
      historyRows,
      question,
    });
    // const [createAssistantMessageResult] = await db.execute(
    //   "INSERT INTO conversations(role,content,token_count) VALUES (?,?,?)",
    //   ["assistant", text, totalTokens],
    // );

    const createAssistantMessageResult = await prisma.conversation.create({
      data: {
        content: text,
        role: "assistant",
        tokenCount: totalTokens,
      },
    });

    const userConversation = await getMessageById(result.id);
    const assistantConversation = await getMessageById(
      createAssistantMessageResult.id,
    );
    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    throw error;
  }
}
