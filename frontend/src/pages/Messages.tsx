/**
 * Messaging System
 *
 * Real-time messaging between buyers and suppliers
 * with conversation threads and notifications
 */
import { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PhotoIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  CheckCircleIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  ArchiveBoxIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: { name: string; url: string; type: string }[];
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    company: string;
    avatar?: string;
    type: 'buyer' | 'supplier';
    online?: boolean;
  };
  lastMessage: Message;
  unreadCount: number;
  starred: boolean;
  archived: boolean;
  relatedRfq?: string;
  relatedOrder?: string;
}

const CURRENT_USER_ID = 'current-user';

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participant: {
      id: 's1',
      name: 'Sarah Chen',
      company: 'EcoSteel Solutions',
      type: 'supplier',
      online: true,
    },
    lastMessage: {
      id: 'm1',
      senderId: 's1',
      content: 'The shipment is on schedule for delivery tomorrow. I\'ll send you the tracking details shortly.',
      timestamp: '2024-01-29T14:30:00Z',
      read: false,
    },
    unreadCount: 2,
    starred: true,
    archived: false,
    relatedOrder: 'ORD-2024-0892',
  },
  {
    id: 'c2',
    participant: {
      id: 's2',
      name: 'Michael Park',
      company: 'GreenConcrete Inc',
      type: 'supplier',
      online: false,
    },
    lastMessage: {
      id: 'm2',
      senderId: CURRENT_USER_ID,
      content: 'Thanks for the quick delivery! The concrete mix worked perfectly.',
      timestamp: '2024-01-28T09:15:00Z',
      read: true,
    },
    unreadCount: 0,
    starred: false,
    archived: false,
    relatedOrder: 'ORD-2024-0856',
  },
  {
    id: 'c3',
    participant: {
      id: 's3',
      name: 'Emma Rodriguez',
      company: 'TimberTech FSC',
      type: 'supplier',
      online: true,
    },
    lastMessage: {
      id: 'm3',
      senderId: 's3',
      content: 'I\'ve attached the updated quote with the custom dimensions you requested.',
      timestamp: '2024-01-27T16:45:00Z',
      read: true,
    },
    unreadCount: 0,
    starred: true,
    archived: false,
    relatedRfq: 'RFQ-2024-0156',
  },
  {
    id: 'c4',
    participant: {
      id: 's4',
      name: 'David Kim',
      company: 'InsulPro Materials',
      type: 'supplier',
      online: false,
    },
    lastMessage: {
      id: 'm4',
      senderId: 's4',
      content: 'No problem, I understand. Let us know when the project is back on track.',
      timestamp: '2024-01-15T11:30:00Z',
      read: true,
    },
    unreadCount: 0,
    starred: false,
    archived: true,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: 'm1a', senderId: CURRENT_USER_ID, content: 'Hi Sarah, just checking on the status of our steel order.', timestamp: '2024-01-29T10:00:00Z', read: true },
    { id: 'm1b', senderId: 's1', content: 'Hi! Good timing - I was just about to reach out. Everything is on track!', timestamp: '2024-01-29T10:15:00Z', read: true },
    { id: 'm1c', senderId: 's1', content: 'The materials passed QC inspection this morning.', timestamp: '2024-01-29T10:16:00Z', read: true },
    { id: 'm1d', senderId: CURRENT_USER_ID, content: 'That\'s great news! When can we expect delivery?', timestamp: '2024-01-29T11:00:00Z', read: true },
    { id: 'm1e', senderId: 's1', content: 'We\'re loading the truck now. Should arrive tomorrow between 8-10 AM.', timestamp: '2024-01-29T14:00:00Z', read: true },
    { id: 'm1f', senderId: 's1', content: 'The shipment is on schedule for delivery tomorrow. I\'ll send you the tracking details shortly.', timestamp: '2024-01-29T14:30:00Z', read: false },
  ],
  c2: [
    { id: 'm2a', senderId: 's2', content: 'Your order has been delivered. Please confirm receipt.', timestamp: '2024-01-24T14:30:00Z', read: true },
    { id: 'm2b', senderId: CURRENT_USER_ID, content: 'Just received it, thank you! Everything looks good.', timestamp: '2024-01-24T16:00:00Z', read: true },
    { id: 'm2c', senderId: 's2', content: 'Wonderful! Let us know if you need anything else.', timestamp: '2024-01-24T16:15:00Z', read: true },
    { id: 'm2d', senderId: CURRENT_USER_ID, content: 'Thanks for the quick delivery! The concrete mix worked perfectly.', timestamp: '2024-01-28T09:15:00Z', read: true },
  ],
  c3: [
    { id: 'm3a', senderId: CURRENT_USER_ID, content: 'Hi Emma, I need to modify our CLT panel order dimensions.', timestamp: '2024-01-27T14:00:00Z', read: true },
    { id: 'm3b', senderId: 's3', content: 'Of course! What are the new specifications?', timestamp: '2024-01-27T14:30:00Z', read: true },
    { id: 'm3c', senderId: CURRENT_USER_ID, content: 'We need 8ft x 4ft instead of 10ft x 4ft. Is that possible?', timestamp: '2024-01-27T15:00:00Z', read: true },
    { id: 'm3d', senderId: 's3', content: 'Yes, we can accommodate that. Let me prepare an updated quote.', timestamp: '2024-01-27T15:30:00Z', read: true },
    { id: 'm3e', senderId: 's3', content: 'I\'ve attached the updated quote with the custom dimensions you requested.', timestamp: '2024-01-27T16:45:00Z', read: true, attachments: [{ name: 'Quote_CLT_Updated.pdf', url: '#', type: 'pdf' }] },
  ],
};

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setConversations(MOCK_CONVERSATIONS);
      setLoading(false);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(MOCK_MESSAGES[selectedConversation.id] || []);
      // Mark as read
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant.company.toLowerCase().includes(searchQuery.toLowerCase());

    switch (filter) {
      case 'unread':
        return matchesSearch && conv.unreadCount > 0;
      case 'starred':
        return matchesSearch && conv.starred;
      case 'archived':
        return matchesSearch && conv.archived;
      default:
        return matchesSearch && !conv.archived;
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `m-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
    };

    setMessages((prev) => [...prev, message]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: message }
          : c
      )
    );
    setNewMessage('');
  };

  const toggleStar = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, starred: !c.starred } : c))
    );
  };

  const toggleArchive = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, archived: !c.archived } : c))
    );
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const totalUnread = conversations.filter((c) => !c.archived).reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-emerald-500" />
              Messages
              {totalUnread > 0 && (
                <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-sm rounded-full">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
            {/* Search & Filter */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'unread', 'starred', 'archived'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                      filter === f
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-gray-700 cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-gray-700/50'
                        : 'hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {conv.participant.avatar ? (
                          <img
                            src={conv.participant.avatar}
                            alt={conv.participant.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            <UserCircleIcon className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        {conv.participant.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{conv.participant.name}</span>
                            {conv.starred && <StarIconSolid className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(conv.lastMessage.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-400 truncate">{conv.participant.company}</div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-300 truncate">
                            {conv.lastMessage.senderId === CURRENT_USER_ID && (
                              <span className="text-gray-500">You: </span>
                            )}
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full ml-2">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {(conv.relatedRfq || conv.relatedOrder) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {conv.relatedRfq && <span className="mr-2">📋 {conv.relatedRfq}</span>}
                            {conv.relatedOrder && <span>📦 {conv.relatedOrder}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-gray-500" />
                      </div>
                      {selectedConversation.participant.online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{selectedConversation.participant.name}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <BuildingOffice2Icon className="w-4 h-4" />
                        {selectedConversation.participant.company}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStar(selectedConversation.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {selectedConversation.starred ? (
                        <StarIconSolid className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleArchive(selectedConversation.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ArchiveBoxIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === CURRENT_USER_ID;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-emerald-600 text-white rounded-br-md'
                              : 'bg-gray-700 text-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  className={`flex items-center gap-2 text-xs ${
                                    isOwn ? 'text-emerald-200' : 'text-gray-400'
                                  } hover:underline`}
                                >
                                  <PaperClipIcon className="w-4 h-4" />
                                  {att.name}
                                </a>
                              ))}
                            </div>
                          )}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              isOwn ? 'text-emerald-200' : 'text-gray-500'
                            }`}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                            {isOwn && (
                              message.read ? (
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                              ) : (
                                <CheckIcon className="w-3.5 h-3.5" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <PaperClipIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <PhotoIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition-colors"
                    >
                      <PaperAirplaneIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
