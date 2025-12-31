import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history } = request.body;
  const apiKey = "AIzaSyCP_WxCzOG5foPnE81G-pZyyAw8LEmkBAk";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(prompt);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    return response.status(200).json({ text });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}