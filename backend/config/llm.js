import OpenAI from "openai";

let client;
const getLLM = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL,
    });
  }
  return client;
};

export default getLLM;
