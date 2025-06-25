
import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Menu, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import ChatSidebar from './ChatSidebar';
import { ChatData, Message } from '../types/chat';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatData[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = () => {
    const stored = localStorage.getItem('chatHistory');
    if (stored) {
      const history = JSON.parse(stored);
      setChatHistory(history);
      if (history.length > 0) {
        setCurrentChatId(history[0].id);
        setMessages(history[0].messages);
      }
    }
  };

  const saveChatHistory = (updatedHistory: ChatData[]) => {
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    setChatHistory(updatedHistory);
  };

  const simulateApiCall = async (message: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple response simulation
    const responses = [
      "That's an interesting question! Let me help you with that.",
      "I understand what you're asking. Here's my perspective:",
      "Great question! Based on what you've mentioned:",
      "I can definitely help with that. Here's what I think:",
      "That's a thoughtful inquiry. Let me break it down:",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} ${message.split('').reverse().join('')}. This is a simulated response for demonstration purposes.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await simulateApiCall(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Update or create chat
      if (currentChatId) {
        const updatedHistory = chatHistory.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages: finalMessages, updatedAt: new Date() }
            : chat
        );
        saveChatHistory(updatedHistory);
      } else {
        const newChat: ChatData = {
          id: Date.now().toString(),
          title: inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : ''),
          messages: finalMessages,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCurrentChatId(newChat.id);
        saveChatHistory([newChat, ...chatHistory]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSidebarOpen(false);
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      setSidebarOpen(false);
    }
  };

  const deleteChat = (chatId: string) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    saveChatHistory(updatedHistory);
    
    if (currentChatId === chatId) {
      if (updatedHistory.length > 0) {
        setCurrentChatId(updatedHistory[0].id);
        setMessages(updatedHistory[0].messages);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onNewChat={startNewChat}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Menu size={20} />
          </Button>
          
          <h1 className="text-lg font-semibold">ChatGPT Clone</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={startNewChat}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Plus size={20} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={48} className="text-gray-600 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-gray-400">Start a conversation by typing a message below.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <ChatMessage
                  message={{
                    id: 'loading',
                    content: '',
                    sender: 'assistant',
                    timestamp: new Date(),
                  }}
                  isLoading={true}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message ChatGPT..."
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
