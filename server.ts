import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize server-side Gemini client with recommended aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Transaction & Ledger Auditor
  app.post("/api/ai/audit", async (req, res) => {
    try {
      const { friends = [], transactions = [], currencySymbol = '₹' } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Settings > Secrets." 
        });
      }

      const inputLedgerSummary = {
        friends: friends.map((f: any) => ({
          name: f.name,
          balance: f.balance,
          lastActivityText: f.lastActivityText,
        })),
        transactions: transactions.map((t: any) => ({
          type: t.type,
          amount: t.amount,
          category: t.category,
          note: t.note,
          paymentMode: t.paymentMode,
          date: t.date,
          isSplit: t.isSplit
        })),
        currencySymbol
      };

      const systemPrompt = `You are the TxnBook Smart Financial AI auditor and accounting assistant.
Your job is to analyze the user's peer-to-peer (P2P) social ledger (friends who owe them money or whom they owe) and personal cashbook transactions.
Provide highly relevant, professional, clear, and actionable feedback including:
1. A Ledger Clarity Score (1-100) reflecting how balanced and prompt their settling behavior is.
2. An insightful summary of the current financial state, highlighting where they have lent the most or spent the most.
3. A "Clear Out Strategy": Bulleted steps recommending who they should follow up with or pay off immediately.
4. "Spending Leaks": Actionable observations on their categories, split behavior, or payment modes (e.g. noticing high online spending or many unpaid lunch bills).
5. "Custom Nudges": Short, polite, personalized, or friendly/humorous payment nudge messages tailored for specific friends based on their balances.

Format the response of your analysis STRICTLY to match the requested JSON schema. Refer to the input currency symbol (${currencySymbol}) where appropriate.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: `Analyze this ledger dataset:\n${JSON.stringify(inputLedgerSummary, null, 2)}` }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Clarity/Health score of this ledger from 1 to 100 based on transaction frequencies and pending debts."
              },
              summary: {
                type: Type.STRING,
                description: "Brief, structured human summary of their monetary state."
              },
              clearOutStrategy: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Bullet points detailing highly strategic clear-out steps."
              },
              spendingLeaks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Bullet points detailing cash outflows leak audits, warning bells, or optimizations."
              },
              customNudges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    friendName: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    message: { type: Type.STRING, description: "Draft polite, context-aware payment nudge note." }
                  },
                  required: ["friendName", "amount", "message"]
                },
                description: "Personal payment nudges for high-balance items."
              }
            },
            required: ["score", "summary", "clearOutStrategy", "spendingLeaks", "customNudges"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedAudit = JSON.parse(responseText.trim());

      return res.json(parsedAudit);

    } catch (err: any) {
      console.error("AI Audit Error:", err);
      return res.status(500).json({ 
        error: "Failed to generate AI Audit. Please verify your connection and try again.",
        details: err?.message || err
      });
    }
  });

  // Setup Vite development middleware OR serve built static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Correct paths for container-deployed standard built files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TxnBook Backend] Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
