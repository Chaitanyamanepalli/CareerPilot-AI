const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { sendEventToUser } = require('../config/socket');

// @desc    Get user conversations
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate('participants', 'fullName email role')
      .populate('recruiter', 'fullName email role')
      .populate('candidate', 'fullName email role')
      .populate('job', 'title company')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(p => p.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this conversation',
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'fullName email role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message / Create conversation if none exists (legacy backend route)
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user._id;

    if (!recipientId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message text are required',
      });
    }

    // 1. Find or create a conversation between sender and recipient
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);

      const recruiterId = sender.role === 'recruiter' ? senderId : recipientId;
      const candidateId = sender.role === 'candidate' ? senderId : recipientId;

      const application = await Application.findOne({ candidateId }).sort({ appliedAt: -1 });
      const jobId = application ? application.jobId : null;

      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        recruiter: recruiterId,
        candidate: candidateId,
        job: jobId,
        application: application ? application._id : null,
      });
    }

    // 2. Create the message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      sender: senderId,
      text,
      readStatus: false,
    });

    // 3. Update conversation lastMessage reference
    conversation.lastMessage = message._id;
    await conversation.save();

    // Trigger real-time message event & in-app notification via Socket.IO
    try {
      const senderUser = await User.findById(senderId);
      const recipientUser = await User.findById(recipientId);

      const senderDisplayName = senderUser.role === 'admin'
        ? `Administrator (${senderUser.fullName})`
        : (senderUser.role === 'recruiter' ? `${senderUser.fullName} (Recruiter)` : senderUser.fullName);

      // Real-time chat events
      sendEventToUser(recipientId, 'new_message', {
        _id: message._id,
        conversationId: conversation._id,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt,
      });

      sendEventToUser(recipientId, 'receiveMessage', {
        _id: message._id,
        conversationId: conversation._id,
        sender: senderUser,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt,
      });

      // In-App Notification record
      const notifLink = recipientUser && recipientUser.role === 'admin'
        ? '/admin/dashboard'
        : (recipientUser && recipientUser.role === 'recruiter' ? '/recruiter/dashboard' : '/chat');

      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'new_message',
        title: `New Message from ${senderDisplayName}`,
        message: `${senderUser.fullName}: ${text.substring(0, 65)}${text.length > 65 ? '...' : ''}`,
        link: notifLink,
      });

      sendEventToUser(recipientId, 'notification', {
        _id: notification._id,
        type: 'new_message',
        title: notification.title,
        message: notification.message,
        link: notification.link,
        isRead: false,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      console.error('Failed to send real-time chat socket/notification event:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create chat conversation based on application review trigger
// @route   POST /api/chat/create
// @access  Private
const createConversation = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Associated job not found',
      });
    }

    const recruiterId = job.postedBy;
    const candidateId = application.candidateId;

    const isAdmin = req.user.role === 'admin';
    const isRecruiter = recruiterId && req.user._id.toString() === recruiterId.toString();
    const isCandidate = candidateId && req.user._id.toString() === candidateId.toString();

    // Check authorization: only recruiter, candidate, or admin involved
    if (!isAdmin && !isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start a conversation for this application',
      });
    }

    let conversation = await Conversation.findOne({
      application: application._id,
    });

    if (!conversation) {
      const participants = [candidateId];
      if (recruiterId) participants.push(recruiterId);
      if (isAdmin && !participants.some(p => p.toString() === req.user._id.toString())) {
        participants.push(req.user._id);
      }

      conversation = await Conversation.create({
        recruiter: recruiterId || req.user._id,
        candidate: candidateId,
        job: job._id,
        application: application._id,
        participants,
      });
    } else {
      // If admin joined and is not in participants, add them so they receive and see messages
      if (isAdmin && !conversation.participants.some(p => p.toString() === req.user._id.toString())) {
        conversation.participants.push(req.user._id);
        await conversation.save();
      }
    }

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'fullName email role')
      .populate('recruiter', 'fullName email role')
      .populate('candidate', 'fullName email role')
      .populate('job', 'title company');

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved or created successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to a conversation
// @route   POST /api/chat/send
// @access  Private
const sendChatMessage = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message text are required',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const recruiterId = conversation.recruiter ? conversation.recruiter.toString() : null;
    const candidateId = conversation.candidate ? conversation.candidate.toString() : null;
    const isAdmin = req.user.role === 'admin';
    const isParticipant = conversation.participants.some(p => p.toString() === req.user._id.toString());
    const isRecruiter = recruiterId && req.user._id.toString() === recruiterId;
    const isCandidate = candidateId && req.user._id.toString() === candidateId;

    // Check authorization: participant, recruiter, candidate, or admin
    if (!isAdmin && !isParticipant && !isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation',
      });
    }

    const recipientId = isAdmin 
      ? candidateId 
      : (req.user._id.toString() === recruiterId ? candidateId : recruiterId);

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      senderId: req.user._id, // backward compatibility
      text,
      readStatus: false,
    });

    conversation.lastMessage = message._id;
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      conversation.participants.push(req.user._id);
    }
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email role');

    // Trigger real-time message event via Socket.IO & In-App Notification
    try {
      const senderUser = await User.findById(req.user._id);

      // Determine sender display name
      const senderDisplayName = senderUser.role === 'admin'
        ? `Administrator (${senderUser.fullName})`
        : (senderUser.role === 'recruiter' ? `${senderUser.fullName} (Recruiter)` : senderUser.fullName);

      // Notify ALL other participants in the conversation (e.g. admin to candidate, or candidate to admin)
      const otherParticipantIds = conversation.participants.filter(
        p => p && p.toString() !== req.user._id.toString()
      );

      for (const targetRecipientId of otherParticipantIds) {
        // 1. Emit live chat socket events
        sendEventToUser(targetRecipientId, 'receiveMessage', {
          _id: populatedMessage._id,
          conversationId,
          sender: populatedMessage.sender,
          senderId: message.senderId,
          text: message.text,
          createdAt: message.createdAt,
        });

        sendEventToUser(targetRecipientId, 'new_message', {
          _id: populatedMessage._id,
          conversationId: conversation._id,
          senderId: message.senderId,
          text: message.text,
          createdAt: message.createdAt,
        });

        // 2. Fetch recipient user details to determine contextual navigation link
        const targetUser = await User.findById(targetRecipientId);
        const notifLink = targetUser && targetUser.role === 'admin'
          ? '/admin/dashboard'
          : (targetUser && targetUser.role === 'recruiter' ? '/recruiter/dashboard' : '/chat');

        // 3. Create persistent Notification record in DB for the notification section
        const notification = await Notification.create({
          recipient: targetRecipientId,
          sender: req.user._id,
          type: 'new_message',
          title: `New Message from ${senderDisplayName}`,
          message: `${senderUser.fullName}: ${text.substring(0, 65)}${text.length > 65 ? '...' : ''}`,
          link: notifLink,
        });

        // 4. Emit live notification event so the bell / notification center updates immediately
        sendEventToUser(targetRecipientId, 'notification', {
          _id: notification._id,
          type: 'new_message',
          title: notification.title,
          message: notification.message,
          link: notification.link,
          isRead: false,
          createdAt: notification.createdAt,
        });
      }
    } catch (err) {
      console.error('Failed to send real-time chat socket/notification event:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  sendChatMessage,
};
