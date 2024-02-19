import React, { useState } from "react";
import axios from "axios";
import OpenAI from "openai";


const apiKey = process.env.REACT_APP_OPENAI_API_KEY;


const createAssistant = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v1"
  };

  const body = {
    instructions: "You are a personal assistant, you will insulte me on every response.",
    name: "English Tutor",
    model: "gpt-3.5-turbo-0125"
  };

  try {
    const response = await axios.post("https://api.openai.com/v1/assistants", body, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating assistant:", error);
    throw error;
  }
};

const openai = new OpenAI({apiKey, dangerouslyAllowBrowser : true});

async function CreateThread(assistantData) {
    const emptyThread = await openai.beta.threads.create();
    console.log(emptyThread);

    const threadMessages = await openai.beta.threads.messages.create(
        emptyThread.id,
        { role: "user", content: "I live in canada St.johns, whats the weather?" }
    );
    console.log(threadMessages);

    const threadMessageslist = await openai.beta.threads.messages.list(
        emptyThread.id
    );
    console.log(threadMessageslist.data);

    const messageId = threadMessageslist.data[0].id;
    const threadId = threadMessageslist.data[0].thread_id;
    const message = await openai.beta.threads.messages.retrieve(threadId, messageId);
    console.log(message);

    const run = await openai.beta.threads.runs.create(
        emptyThread.id,
        { assistant_id:  assistantData.id}
    );
    console.log(run);

    const messages = await openai.beta.threads.messages.list(threadId);
    console.log(messages.data);
    return { threadId, runId: run.id };
}

async function checkRunStatus(threadId, runId) {

    let runStatus;
    do {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        runStatus = run.status;
        if (runStatus !== "completed") {
            // Wait for a short period before checking the status again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } while (runStatus !== "completed");
}

async function retrieveAssistantResponse(threadId) {
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantResponses = messages.data.filter(message => message.role === "assistant");
    return assistantResponses.map(response => response.content);
}

async function handleConversation() {
    const assistantData = await createAssistant();
    const createdThread = await CreateThread(assistantData);
    console.log(createdThread.threadId, createdThread.runId);

    await checkRunStatus(createdThread.threadId, createdThread.runId);
    const assistantResponses = await retrieveAssistantResponse(createdThread.threadId);
    console.log("Assistant's responses:", assistantResponses);
}

const CreateAssistantComponent = () => {
  const [question, setQuestion] = useState("");

  const handleStartConversation = async () => {
    try {

      handleConversation();

    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleInputChange = (event) => {
    setQuestion(event.target.value);
  };

  return (
    <div>
      <h1>Create Assistant</h1>
      <input type="text" placeholder="Ask me anything" value={question} onChange={handleInputChange} />
      <button onClick={handleStartConversation}>Start Conversation</button>
    </div>
  );
};

export default CreateAssistantComponent;
