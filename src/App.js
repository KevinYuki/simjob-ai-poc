import logo from "./logo.svg";
import "./App.css";
import { Button, MessageBox } from "react-chat-elements";
import "react-chat-elements/dist/main.css";
import { useState } from "react";
import axios from "axios";
import validator from "@rjsf/validator-ajv8";
import Form from "@rjsf/core";

function App() {
  const API_KEY = process.env.REACT_APP_OPEN_API_KEY;
  const [isTyping, setIsTyping] = useState(false);
  const [schema, setSchema] = useState({
    title: "",
    type: "object",
    properties: {},
  });
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        'Você é um framework chamado Simjob, usado para criar formulários no formato Open Schema. Um exemplo para seguir é o seguinte json: {"title": "Cadastro de usuário","description": "Formulário para cadastro de usuário.","type": "object","required": [],"properties": {"nome": {"type": "string","title": "Nome"},"sobrenome": {"type": "string","title": "Sobrenome"},"idade": { "type": "integer","title": "Idade"},}}. Você não deve falar nada, apenas responder com o json do formulário pedido. Caso a pergunta não tenha uma resposta desse tipo, apenas responda explicando a sua funcionalidade, dando o seguinte exemplo de pergunta: Crie um formulario de cadastro de usuario, com os campos nome, endereco e idade',
    },
  ]);

  const chatData = async (userMessage) => {
    try {
      const body = {
        model: "gpt-3.5-turbo",
        messages: [...messages, { role: "user", content: userMessage }],
        temperature: 0.7,
      };
      const config = {
        headers: { Authorization: `Bearer ${API_KEY}` },
      };
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        body,
        config
      );

      if (response.status !== 200) {
        throw new Error(
          "Oops! Something went wrong while processing your request."
        );
      }

      const responseData = await response.data;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: responseData.choices[0].message.role,
          content: responseData.choices[0].message.content,
        },
      ]);
      try {
        const schema = JSON.parse(responseData.choices[0].message.content);
        setSchema(schema);
      } catch (e) {
        console.error("Error while fetching chat data:", e);
      }
      setIsTyping(false);
    } catch (error) {
      console.error("Error while fetching chat data:", error);
      setIsTyping(false);
    }
  };

  const handleSendMessage = (messageContent) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: messageContent },
    ]);
    //invoke chatData
    chatData(messageContent);
    setIsTyping(true);
  };

  return (
    <div style={{ width: "100%", display: 'flex' }}>
      <div
        style={{
          width: "50%",
          backgroundColor: "grey",
          padding: "16px",
          border: "1px solid black",
          borderRadius: "5px!important",
        }}
      >
        <h2>Chat</h2>
        <div>
          {messages
            .filter((message) => message.role !== "system")
            .map((message, index) => (
              <MessageBox
                position={message.role === "user" ? "right" : "left"}
                type={"text"}
                title={message.role}
                text={message.content}
                titleColor={message.role === "user" ? "red" : "blue"}
              />
            ))}
          {isTyping && <p>Bot is typing...</p>}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.input.value;
            if (input.trim() !== "") {
              handleSendMessage(input);
              e.target.reset();
            }
          }}
        >
          <input
            type="text"
            name="input"
            placeholder="Type your message..."
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping}>
            Send
          </button>
        </form>
      </div>
      <div style={{ width: "50%" }}>
        <Form schema={schema} validator={validator} />
      </div>
    </div>
  );
}

export default App;
