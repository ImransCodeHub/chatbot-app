// ActionProvider starter code
class ActionProvider {
  constructor(
    createChatBotMessage,
    setStateFunc,
    createClientMessage,
    stateRef,
    createCustomMessage,
    ...rest
  ) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
    this.stateRef = stateRef;
    this.createCustomMessage = createCustomMessage;
  }

  handleStartConversation = async (message) => {
    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message }) //change to message: question?
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data);
      
      // Fix the response format - it should be an array of messages and from the array of messages, it should take the laest message and from that message, it should take the text value
      if (data.messages && data.messages[0] && data.messages[0][0] && data.messages[0][0].text) {
        const botResponse = this.createChatBotMessage(data.messages[0][0].text.value);
        console.log(botResponse);
        this.addMessageToState(botResponse);
      } else {
        console.error("Error: Invalid response format");
      }

    } catch (error) {
      console.error("Error:", error);
    }
  };

  addMessageToState = (message) => {
    this.setState((state) => ({
      ...state,
      messages: [...state.messages, message]
    }));
  };
}

export default ActionProvider;