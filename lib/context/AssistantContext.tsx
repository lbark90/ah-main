
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AssistantData {
  assistantId: string;
  name: string;
  status: string;
  createdAt: string;
  userId: string;
}

export interface ConversationData {
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

interface AssistantContextType {
  assistant: AssistantData | null;
  conversation: ConversationData | null;
  isLoading: boolean;
  isProcessing: boolean;
  createAssistant: (name: string) => Promise<AssistantData>;
  startConversation: (message: string) => Promise<ConversationData>;
  sendMessage: (message: string) => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType>({
  assistant: null,
  conversation: null,
  isLoading: true,
  isProcessing: false,
  createAssistant: async () => ({ assistantId: '', name: '', status: '', createdAt: '', userId: '' }),
  startConversation: async () => ({ conversationId: '', messages: [] }),
  sendMessage: async () => {},
});

export const useAssistant = () => useContext(AssistantContext);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [assistant, setAssistant] = useState<AssistantData | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadAssistant = () => {
      try {
        const storedAssistant = localStorage.getItem('aliveHereAssistant');
        if (storedAssistant) {
          setAssistant(JSON.parse(storedAssistant));
        }

        const storedConversation = localStorage.getItem('aliveHereConversation');
        if (storedConversation) {
          setConversation(JSON.parse(storedConversation));
        }
      } catch (error) {
        console.error('Error loading assistant data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssistant();
  }, []);

  const createAssistant = async (name: string): Promise<AssistantData> => {
    try {
      setIsProcessing(true);

      const assistantData: AssistantData = {
        assistantId: `assistant_${Date.now()}`,
        name,
        status: 'active',
        createdAt: new Date().toISOString(),
        userId: `user_${Date.now()}`,
      };

      localStorage.setItem('aliveHereAssistant', JSON.stringify(assistantData));
      setAssistant(assistantData);

      return assistantData;
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const startConversation = async (message: string): Promise<ConversationData> => {
    try {
      setIsProcessing(true);

      // Create assistant if not exists
      let currentAssistant = assistant;
      if (!currentAssistant) {
        currentAssistant = await createAssistant("AI Assistant");
      }

      const conversationData: ConversationData = {
        conversationId: `conv_${Date.now()}`,
        messages: [
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          }
        ]
      };

      localStorage.setItem('aliveHereConversation', JSON.stringify(conversationData));
      setConversation(conversationData);

      return conversationData;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async (message: string): Promise<void> => {
    try {
      setIsProcessing(true);

      if (!assistant || !conversation) {
        throw new Error('No active conversation');
      }

      const updatedMessages = [
        ...conversation.messages,
        {
          role: 'user' as const,
          content: message,
          timestamp: new Date().toISOString()
        }
      ];

      const updatedConversation = {
        ...conversation,
        messages: updatedMessages
      };

      localStorage.setItem('aliveHereConversation', JSON.stringify(updatedConversation));
      setConversation(updatedConversation);

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AssistantContext.Provider value={{ 
      assistant, 
      conversation, 
      isLoading, 
      isProcessing, 
      createAssistant, 
      startConversation, 
      sendMessage 
    }}>
      {children}
    </AssistantContext.Provider>
  );
}
