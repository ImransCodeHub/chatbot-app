import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import axios from 'axios';
import client from './mongo.js';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 3001;

// Add to .env file
const existingAssistantId = process.env.OPENAI_ASSISTANT_ID;
const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

app.use(express.json());
app.use(cors());


app.get('/api/getUserThread', async (req, res) => {
  const {authorization} = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
    // return user_thread = null;
  }
  try {
    const token = authorization.split(' ')[1];
    jwt.verify(token, JWTSecret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      try {
        const userThreadRetrieved = await client.db('easyshopper').collection('user_threads').findOne({ email: decoded.email });
        if (!userThreadRetrieved) {
          return res.status(404).json({ error: 'User thread not found' });
          // return user_thread = null;
        }
        res.json(userThreadRetrieved);
        // return user_thread = userThreadRetrieved;

      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 

// if retrieveUserThread returns null, then create a new thread with the user's email
const retrieveUserThread = async (accessToken, assistantId) => {
  
  let userThreadId;

  await fetch('/api/getUserThread', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      userThreadId = data;
    });

    // Why do I need to retrieve userThreadInfo? If I already have the userThreadId from the userDB?
    const userThreadInfo = await openai.beta.threads.retrieve(userThreadId);

    const run = await openai.beta.threads.runs.create(
      userThreadId,
      { assistant_id: assistantId }
    );

    const messages = await openai.beta.threads.messages.list(userThreadId);
    console.log(messages.data);
    return { userThreadId, runId: run.id };

}


const retrieveAssistant = async () => {
  const myAssistant = await openai.beta.assistants.retrieve(existingAssistantId);
  console.log(myAssistant);
  return myAssistant;
};

const createAssistant = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v1"
  };

  const body = {
    //instructions: "You are a customer service assistant for a e-commerce website, you will insulte the customers on every response.",
    instructions: "You are a customer service assistant for a e-commerce website, I am testing you and checking if implemented correctly.",
    
    name: "easyshopper.ca customer service assistant",
    model: "gpt-3.5-turbo-0125"
  };

  try {
    const response = await axios.post("https://api.openai.com/v1/assistants", body, { headers });
    console.log("Assistant created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating assistant:", error);
    throw error;
  }
};

// Add code to add the ceated thread to the database with the user's email
async function CreateThread(assistantData, message) {
  const emptyThread = await openai.beta.threads.create();
  console.log(emptyThread);

  const threadMessages = await openai.beta.threads.messages.create(
      emptyThread.id,
      { role: "user", content: message }
  );
  console.log(threadMessages);

  const threadMessageslist = await openai.beta.threads.messages.list(
      emptyThread.id
  );
  console.log(threadMessageslist.data);

  const messageId = threadMessageslist.data[0].id;
  const threadId = threadMessageslist.data[0].thread_id;
  const botReply = await openai.beta.threads.messages.retrieve(threadId, messageId);
  console.log(botReply);

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


app.post('/chat', async (req, res) => {
  const { message } = req.body;
  try {
    if (!message) {
      return res.json({ messages: "Hello, how can I help you today?" });
    }

    const assistantData = await retrieveAssistant();
    const threadData = await retrieveUserThread(accessToken, assistantData.id);
    await checkRunStatus(threadData.userThreadId, threadData.runId);
    const assistantResponses = await retrieveAssistantResponse(threadData.userThreadId);
    if (!assistantData) {
      assistantData = await createAssistant();
      threadData = await CreateThread(assistantData, message);
      await checkRunStatus(createdThread.threadId, createdThread.runId);
      assistantResponses = await retrieveAssistantResponse(createdThread.threadId);
    }
    res.json({ messages: assistantResponses });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
