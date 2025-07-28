"use client";

import ChatLayout from "@/app/components/aiChat/ChatLayout";
import React, { useState, useRef, useEffect, useCallback } from "react";
import PromptCards from "@/app/components/aiChat/PromptCards";
import ChatInput from "@/app/components/aiChat/ChatInput";
import ChatMessageList from "@/app/components/aiChat/ChatMessageList";

const AIChatPage = () => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIntervalRef = useRef(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        const messagesWithDates = parsedMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
        setDefaultMessage();
      }
    } else {
      setDefaultMessage();
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages]);

  const setDefaultMessage = () => {
    setMessages([
      {
        id: 1,
        text: "Hi there! I'm your AI assistant. How can I help you today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const handleNewChat = () => {
    localStorage.removeItem("chatHistory");
    setDefaultMessage();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to stream the response word by word
  const streamResponse = useCallback((responseText, onComplete) => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    const words = responseText.split(/(\s+)/); // Split by whitespace but keep the spaces
    let currentIndex = 0;
    let currentText = '';

    // Create a stable ID for the AI message
    const aiMessageId = 'ai-' + Date.now();

    // Add the initial AI message with empty text
    setMessages(prev => [
      ...prev.filter(msg => !msg.isLoading),
      {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true
      }
    ]);

    return new Promise((resolve) => {
      streamingIntervalRef.current = setInterval(() => {
        if (currentIndex >= words.length) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
          setIsStreaming(false);
          onComplete?.();
          resolve();
          return;
        }

        currentText += words[currentIndex];
        currentIndex++;

        // Only update the text content of the AI message
        setMessages(prev => {
          const newMessages = [...prev];
          const aiMessageIndex = newMessages.findIndex(msg => msg.id === aiMessageId);
          if (aiMessageIndex !== -1) {
            newMessages[aiMessageIndex] = {
              ...newMessages[aiMessageIndex],
              text: currentText.trim()
            };
          }
          return newMessages;
        });
      }, Math.floor(Math.random() * 51) + 30); // Random delay between 30-80ms
    });
  }, []);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (message) => {
    if (!message.trim() || isStreaming) return;
    
    // Set streaming state
    setIsStreaming(true);

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Show loading state
    const loadingMessage = {
      id: "loading-" + Date.now(),
      text: "Thinking...",
      sender: "ai",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Prepare messages array in the format expected by the API
      const chatMessages = [
        ...messages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
        { role: "user", content: message },
      ];

      console.log("Sending request to API with messages:", chatMessages);

      let response;
      let responseData;

      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: chatMessages }),
        });

        console.log("API response status:", response.status);

        // First, get the response as text to handle potential non-JSON responses
        const responseText = await response.text();

        // Try to parse as JSON, but handle cases where it's not valid JSON
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (jsonError) {
          console.error("Failed to parse API response as JSON:", jsonError);
          throw new Error(
            `Invalid response from server: ${response.status} ${response.statusText}`
          );
        }

        console.log("API response data:", responseData);

        if (!response.ok) {
          throw new Error(
            responseData.error ||
              responseData.message ||
              `Request failed with status ${response.status}`
          );
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(
          fetchError.message || "Failed to connect to the server"
        );
      }

      // Stream the response word by word
      await streamResponse(responseData.content, () => {
        // This runs when streaming is complete
        setMessages(prev => {
          const newMessages = [...prev];
          const aiMessageIndex = newMessages.findIndex(msg => msg.isStreaming);
          if (aiMessageIndex !== -1) {
            newMessages[aiMessageIndex] = {
              ...newMessages[aiMessageIndex],
              isStreaming: false
            };
          }
          return newMessages;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);

      // Show error message with streaming effect
      const errorMessages = [
        `I'm having trouble connecting to the AI service. (${error.message})`,
        `Sorry, I encountered an error: ${error.message}`,
        `I'm unable to process your request: ${error.message}`,
      ];
      const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      await streamResponse(errorMessage, () => {
        setMessages(prev => {
          const newMessages = [...prev];
          const aiMessageIndex = newMessages.findIndex(msg => msg.isStreaming);
          if (aiMessageIndex !== -1) {
            newMessages[aiMessageIndex] = {
              ...newMessages[aiMessageIndex],
              isStreaming: false,
              isError: true
            };
          }
          return newMessages;
        });
      });
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  return (
    <ChatLayout onNewChat={handleNewChat}>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto">
          {messages.length <= 1 ? (
            <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-lg">Hello 👋</h2>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    What would you like to know?
                  </h1>
                  <p className="text-sm text-gray-500 mt-2">
                    Use one of the most common prompts below or type your own.
                  </p>
                </div>
                <PromptCards onSelectPrompt={handleQuickPrompt} />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
              <ChatMessageList messages={messages} />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto w-full p-4">
            <ChatInput onSendMessage={handleSendMessage} isSending={isStreaming} />
          </div>
        </div>
      </div>
    </ChatLayout>
  );
};

export default AIChatPage;
