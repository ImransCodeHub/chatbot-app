import logo from './logo.svg';
import './App.css';
// import ChatbotUI from './ChatbotUIfiles/ChatbotUI.js';
import CreateAssistantComponent from './CreateAssistantComponent';
import ActionProvider from './ChatbotUIfiles/ActionProvider.js';
import MessageParser from './ChatbotUIfiles/MessageParser.js';
import config from './ChatbotUIfiles/config.js';

import React, { useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import easyshopperChatbotIcon from './easyshopper-chatbot-icon.png';
import './ChatbotUIfiles/ChatbotUI.css';


function App() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="App">

      {/* Floating chatbot container */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h1>Chatbot</h1>
            <button onClick={toggleChatbot}>Close</button>
          </div>
          <Chatbot
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
          />
        </div>
      )}
      {/* Floating chatbot icon */}
      <div className="chatbot-icon" onClick={toggleChatbot}>
        <img src={easyshopperChatbotIcon} alt="Chatbot" />
      </div>



      <div className="App-header">
        <h1>EasyShopper</h1>
        <h2>Chat with the Assistant</h2>
        
      </div>
    </div>
  );
}

export default App;

