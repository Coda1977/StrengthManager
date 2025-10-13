'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updated_at: string;
}

// Simple markdown formatter
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(\d+)\.\s+(.*)$/gm, '<div style="margin: 4px 0; padding-left: 20px;"><strong>$1.</strong> $2</div>')
    .replace(/^-\s+(.*)$/gm, '<div style="margin: 4px 0; padding-left: 20px;">• $1</div>')
    .replace(/\n/g, '<br>');
}

export default function ChatClient() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [starterQuestions, setStarterQuestions] = useState<string[]>([]);
  const [loadingStarters, setLoadingStarters] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<{ [msgId: string]: string[] }>({});
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchStarterQuestions();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollButton]);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [message, autoResizeTextarea]);

  // Track scroll position
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data.data?.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchStarterQuestions = async () => {
    setLoadingStarters(true);
    try {
      const response = await fetch('/api/starter-questions', { method: 'POST' });
      const data = await response.json();
      setStarterQuestions(data.data?.questions || [
        "How can I better leverage my top strengths as a leader?",
        "What are some ways to develop my team's potential?",
        "How do I handle conflicts based on different strength combinations?"
      ]);
    } catch (error) {
      setStarterQuestions([
        "How can I better leverage my top strengths as a leader?",
        "What are some ways to develop my team's potential?",
        "How do I handle conflicts based on different strength combinations?"
      ]);
    } finally {
      setLoadingStarters(false);
    }
  };

  const fetchFollowUpQuestions = async (aiMessageId: string, aiContent: string) => {
    try {
      const response = await fetch('/api/followup-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiAnswer: aiContent,
          conversationHistory: messages
        })
      });
      const data = await response.json();
      setFollowUpQuestions(prev => ({
        ...prev,
        [aiMessageId]: data.data?.questions || []
      }));
    } catch (error) {
      console.error('Error fetching follow-up questions:', error);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Create placeholder AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      type: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullResponse += parsed.text;
                  // Update message in real-time
                  setMessages(prev => prev.map(m =>
                    m.id === aiMessageId ? { ...m, content: fullResponse } : m
                  ));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setIsTyping(false);
      
      // Fetch follow-up questions
      fetchFollowUpQuestions(aiMessageId, fullResponse);

      // Save conversation
      const finalAiMessage = { ...aiMessage, content: fullResponse };
      if (!currentChatId) {
        await saveNewConversation([userMessage, finalAiMessage]);
      } else {
        await saveMessages(currentChatId, [userMessage, finalAiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(m =>
        m.id === aiMessageId
          ? { ...m, content: 'ERROR: Sorry, I encountered an error. Please try again.' }
          : m
      ));
      setIsTyping(false);
    }
  }, [message, isTyping, messages, currentChatId]);

  const retryLastMessage = () => {
    const lastUserMessage = messages.filter(m => m.type === 'user').pop();
    if (lastUserMessage) {
      setMessage(lastUserMessage.content);
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  const saveNewConversation = async (initialMessages: Message[]) => {
    try {
      // Generate better title with AI
      const titleResponse = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage: initialMessages[0].content })
      });
      
      let title = initialMessages[0].content.slice(0, 50);
      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        title = titleData.data?.title || title;
      }
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, mode: 'my-strengths' })
      });

      const data = await response.json();
      const conversationId = data.data.conversation.id;
      setCurrentChatId(conversationId);

      await saveMessages(conversationId, initialMessages);
      fetchConversations();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const saveMessages = async (conversationId: string, msgs: Message[]) => {
    try {
      for (const msg of msgs) {
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: msg.content,
            type: msg.type
          })
        });
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();
      
      setMessages(data.data.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
      setCurrentChatId(conversationId);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setMessage('');
    setCurrentChatId(null);
    setFollowUpQuestions({});
    fetchStarterQuestions();
  };

  const deleteConversation = async (conversationId: string) => {
    setDeleteTarget(conversationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await fetch(`/api/conversations/${deleteTarget}`, { method: 'DELETE' });
      
      if (currentChatId === deleteTarget) {
        startNewChat();
      }
      
      fetchConversations();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      position: 'relative',
      paddingTop: '80px'
    }}>
      {/* Copy Toast */}
      {showCopyToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#10B981',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 2000,
          fontSize: '14px',
          fontWeight: 600
        }}>
          ✓ Copied to clipboard!
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.5rem', color: '#1A1A1A' }}>
              Delete Conversation?
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#4A4A4A',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation History Sidebar */}
      {showHistory && (
        <>
          <div
            onClick={() => setShowHistory(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            left: 0,
            top: 80,
            bottom: 0,
            width: '320px',
            background: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Sidebar Header with New Chat */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                Chat History
              </h3>
              <button
                onClick={() => {
                  startNewChat();
                  setShowHistory(false);
                }}
                style={{
                  background: '#003566',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#002244')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#003566')}
              >
                + New
              </button>
            </div>
            
            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {conversations.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', marginTop: '2rem' }}>
                  No conversations yet
                </p>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: currentChatId === conv.id ? '#F5EFE7' : '#FAFAFA',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      border: currentChatId === conv.id ? '2px solid #003566' : '2px solid transparent'
                    }}
                  >
                    <div
                      onClick={() => loadConversation(conv.id)}
                      style={{
                        flex: 1,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.25rem', color: '#1A1A1A' }}>
                        {conv.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#DC2626',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Delete conversation"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Chat Area - Full Page Scroll */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        padding: '2rem',
        paddingBottom: '10rem',
        minHeight: 'calc(100vh - 80px)'
      }}>
        {/* Header with History Button */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('History button clicked');
              setShowHistory(prev => !prev);
            }}
            type="button"
            style={{
              background: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
            title="Chat History"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <path d="M3 5h18M3 10h18M3 15h18"/>
            </svg>
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            AI Strengths Coach
          </h2>
        </div>

        {/* Messages - Full Page Scroll */}
        <div style={{ marginBottom: '2rem' }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem'
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '1rem', color: '#1A1A1A' }}>
                Welcome to your AI Strengths Coach!
              </h2>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '2rem' }}>
                I'm here to help you understand and leverage your CliftonStrengths for better leadership.
              </p>
              
              {loadingStarters ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxWidth: '700px',
                  margin: '0 auto'
                }}>
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      style={{
                        background: '#E5E7EB',
                        borderRadius: '16px',
                        height: '60px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxWidth: '700px',
                  margin: '0 auto'
                }}>
                  {starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMessage(q);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      style={{
                        background: '#FFFFFF',
                        border: '2px solid #F5EFE7',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        fontSize: '15px',
                        color: '#1A1A1A',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#003566';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#F5EFE7';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: msg.type === 'user' ? '#003566' : '#FFD600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {msg.type === 'user' ? '👤' : '⭐'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '1rem 1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        marginBottom: msg.type === 'ai' ? '0.5rem' : '0'
                      }}>
                        {msg.type === 'user' ? (
                          <div style={{
                            fontSize: '15px',
                            lineHeight: '1.6',
                            color: '#1A1A1A',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.content}
                          </div>
                        ) : msg.content.startsWith('ERROR:') ? (
                          <div>
                            <div style={{ color: '#DC2626', marginBottom: '0.75rem' }}>
                              {msg.content.replace('ERROR: ', '')}
                            </div>
                            <button
                              onClick={retryLastMessage}
                              style={{
                                background: '#003566',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '15px',
                              lineHeight: '1.6',
                              color: '#1A1A1A'
                            }}
                            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                          />
                        )}
                      </div>
                      {msg.type === 'ai' && !msg.content.startsWith('ERROR:') && (
                        <button
                          onClick={() => copyMessage(msg.content)}
                          style={{
                            background: '#F5EFE7',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '13px',
                            color: '#6B7280',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = '#E8DFD0')}
                          onMouseOut={(e) => (e.currentTarget.style.background = '#F5EFE7')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1-2-2h2"/>
                          </svg>
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Follow-up Questions */}
                  {msg.type === 'ai' && followUpQuestions[msg.id] && followUpQuestions[msg.id].length > 0 && (
                    <div style={{
                      marginLeft: '56px',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {followUpQuestions[msg.id].map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setMessage(q);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          style={{
                            background: '#F5EFE7',
                            border: '1px solid #E8DFD0',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            fontSize: '14px',
                            color: '#1A1A1A',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#E8DFD0';
                            e.currentTarget.style.borderColor = '#003566';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#F5EFE7';
                            e.currentTarget.style.borderColor = '#E8DFD0';
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#FFD600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    ⭐
                  </div>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1rem 1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#6B7280',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }} />
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#6B7280',
                        animation: 'pulse 1.5s ease-in-out 0.2s infinite'
                      }} />
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#6B7280',
                        animation: 'pulse 1.5s ease-in-out 0.4s infinite'
                      }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
          
        </div>
      </div>

      {/* Scroll to Bottom Button - Fixed Position */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'fixed',
            bottom: '7rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#003566',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 100
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </button>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#F5F0E8',
        borderTop: '1px solid #E5E7EB',
        padding: '1.5rem',
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your strengths or team..."
            disabled={isTyping}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '15px',
              fontFamily: 'inherit',
              minHeight: '24px',
              maxHeight: '120px',
              padding: '0.5rem',
              background: 'transparent',
              overflow: 'hidden'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isTyping}
            style={{
              background: '#003566',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!message.trim() || isTyping) ? 'not-allowed' : 'pointer',
              opacity: (!message.trim() || isTyping) ? 0.5 : 1,
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              if (message.trim() && !isTyping) {
                e.currentTarget.style.background = '#002244';
              }
            }}
            onMouseOut={(e) => {
              if (message.trim() && !isTyping) {
                e.currentTarget.style.background = '#003566';
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}