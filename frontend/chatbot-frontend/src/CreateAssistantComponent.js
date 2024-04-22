import React, { useState } from "react";

const CreateAssistantComponent = () => {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);

    const handleStartConversation = async () => {
        try {
            const response = await fetch('http://localhost:3001/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: question })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setMessages(data.messages);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleInputChange = (event) => {
        setQuestion(event.target.value);
    };

    return (
        <div>
            <h1>Chat with the Assistant</h1>
            <div>
                {messages.map((message, index) => (
                    <div key={index}>
                        {message.map((item, subIndex) => (
                            <p key={subIndex}>{item.text.value}</p>
                        ))}
                    </div>
                ))}
            </div>
            <input type="text" value={question} onChange={handleInputChange} />
            <button onClick={handleStartConversation}>Send</button>
        </div>
    );
};

export default CreateAssistantComponent;
