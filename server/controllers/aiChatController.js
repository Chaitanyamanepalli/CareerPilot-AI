// ====================================================
// AIChat Controller — CareerPilot AI
//
// Handles candidate conversation sessions with the AI Placement Assistant
// powered by local Ollama (gemma3:4b). Manages persistence, history context,
// and smart title generation.
// ====================================================

const AIChat = require('../models/AIChat');
const { generateChatResponse } = require('../utils/ollamaService');

// @desc    Get all conversations for the authenticated candidate
// @route   GET /api/ai-chat/conversations
// @access  Private (Candidate)
const getConversations = async (req, res, next) => {
  try {
    const conversations = await AIChat.find({ user: req.user._id })
      .select('title category createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    // Map to include message count and last message preview for sidebar
    const result = conversations.map((conv) => {
      const lastMsg = conv.messages && conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1]
        : null;

      return {
        _id: conv._id,
        title: conv.title,
        category: conv.category,
        messageCount: conv.messages ? conv.messages.length : 0,
        lastMessage: lastMsg ? {
          content: lastMsg.content.substring(0, 80),
          role: lastMsg.role,
          timestamp: lastMsg.timestamp,
        } : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single conversation by ID with full message history
// @route   GET /api/ai-chat/conversations/:id
// @access  Private (Candidate)
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await AIChat.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a new conversation session
// @route   POST /api/ai-chat/conversations
// @access  Private (Candidate)
const startConversation = async (req, res, next) => {
  try {
    const { title, category, initialMessage } = req.body;

    let convTitle = title ? title.trim() : 'New Conversation';
    let initialCategory = category || 'General';

    const conversation = new AIChat({
      user: req.user._id,
      title: convTitle,
      category: initialCategory,
      messages: [],
    });

    // If candidate started conversation with an initial prompt
    if (initialMessage && initialMessage.trim()) {
      const userText = initialMessage.trim();
      conversation.messages.push({
        role: 'user',
        content: userText,
      });

      if (!title) {
        // Auto-generate title from first 35 chars
        conversation.title = userText.length > 35
          ? userText.substring(0, 35) + '...'
          : userText;
      }

      // Generate AI response
      try {
        const aiReply = await generateChatResponse([{ role: 'user', content: userText }]);
        conversation.messages.push({
          role: 'assistant',
          content: aiReply,
        });
      } catch (aiErr) {
        console.error('AI chat initial reply error:', aiErr.message);
        conversation.messages.push({
          role: 'assistant',
          content: "Hello! I am your CareerPilot AI Placement Coach. I'm ready to help you with DSA, interview prep, resumes, and HR questions. How can I help you today?",
        });
      }
    }

    await conversation.save();

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in an existing conversation and receive AI response
// @route   POST /api/ai-chat/conversations/:id/messages
// @access  Private (Candidate)
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const conversation = await AIChat.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const userMessageContent = message.trim();

    // Append user message
    conversation.messages.push({
      role: 'user',
      content: userMessageContent,
    });

    // If title was default, auto-generate from first user message
    if (conversation.title === 'New Conversation') {
      conversation.title = userMessageContent.length > 35
        ? userMessageContent.substring(0, 35) + '...'
        : userMessageContent;
    }

    // Prepare context window: send last 12 messages for conversation continuity
    const historyWindow = conversation.messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call Ollama local AI
    let aiReply;
    try {
      aiReply = await generateChatResponse(historyWindow);
    } catch (aiErr) {
      console.error('Ollama chat error:', aiErr.message);
      aiReply = "I encountered an issue connecting to the AI model. Please ensure Ollama is running locally with `gemma3:4b` and try again.";
    }

    // Append AI reply
    conversation.messages.push({
      role: 'assistant',
      content: aiReply,
    });

    await conversation.save();

    const latestAssistantMessage = conversation.messages[conversation.messages.length - 1];

    res.status(200).json({
      success: true,
      data: {
        message: latestAssistantMessage,
        conversationTitle: conversation.title,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a conversation session
// @route   DELETE /api/ai-chat/conversations/:id
// @access  Private (Candidate)
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await AIChat.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getConversationById,
  startConversation,
  sendMessage,
  deleteConversation,
};
