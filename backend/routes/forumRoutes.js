// routes/forumRoutes.js - Routes for forum discussions
const express = require('express');
const mongoose = require('mongoose');
const { authToken, roleCheck } = require('../middleware/authMiddleware');
const ForumPost = require('../model/ForumPost');
const ForumReply = require('../model/ForumReply');

const router = express.Router();

// GET /forums - Get all forum posts
router.get('/', authToken, async (req, res) => {
  try {
    const { category, search, sort = 'recent' } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { replyCount: -1, views: -1 };
    if (sort === 'recent') sortOption = { lastReplyAt: -1, createdAt: -1 };

    const posts = await ForumPost.find(filter)
      .populate('author', 'name email role avatarUrl')
      .sort(sortOption)
      .limit(50);

    res.json(posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author._id,
        name: post.author.name,
        email: post.author.email,
        role: post.author.role,
        avatar_url: post.author.avatarUrl
      },
      category: post.category,
      tags: post.tags,
      views: post.views,
      reply_count: post.replyCount,
      is_pinned: post.isPinned,
      is_locked: post.isLocked,
      last_reply_at: post.lastReplyAt,
      created_at: post.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load forum posts', error: error.message });
  }
});

// GET /forums/:id - Get a specific forum post with replies
router.get('/:id', authToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name email role avatarUrl');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment views
    post.views += 1;
    await post.save();

    const replies = await ForumReply.find({ post: post._id })
      .populate('author', 'name email role avatarUrl')
      .populate('parentReply')
      .populate('likes', 'name')
      .sort({ createdAt: 1 });

    res.json({
      id: post._id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author._id,
        name: post.author.name,
        email: post.author.email,
        role: post.author.role,
        avatar_url: post.author.avatarUrl
      },
      category: post.category,
      tags: post.tags,
      views: post.views,
      reply_count: post.replyCount,
      is_pinned: post.isPinned,
      is_locked: post.isLocked,
      created_at: post.createdAt,
      replies: replies.map(reply => ({
        id: reply._id,
        content: reply.content,
        author: {
          id: reply.author._id,
          name: reply.author.name,
          email: reply.author.email,
          role: reply.author.role,
          avatar_url: reply.author.avatarUrl
        },
        parent_reply_id: reply.parentReply?._id || null,
        likes: reply.likes.length,
        is_solution: reply.isSolution,
        created_at: reply.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load forum post', error: error.message });
  }
});

// POST /forums - Create a new forum post
router.post('/', authToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = await ForumPost.create({
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      author: req.user._id
    });

    const populated = await ForumPost.findById(post._id)
      .populate('author', 'name email role avatarUrl');

    res.status(201).json({
      id: populated._id,
      title: populated.title,
      content: populated.content,
      author: {
        id: populated.author._id,
        name: populated.author.name,
        role: populated.author.role
      },
      category: populated.category,
      tags: populated.tags,
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create forum post', error: error.message });
  }
});

// POST /forums/:id/replies - Reply to a forum post
router.post('/:id/replies', authToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(400).json({ message: 'This post is locked' });
    }

    const { content, parentReplyId } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const reply = await ForumReply.create({
      post: post._id,
      author: req.user._id,
      content,
      parentReply: parentReplyId || null
    });

    const populated = await ForumReply.findById(reply._id)
      .populate('author', 'name email role avatarUrl');

    res.status(201).json({
      id: populated._id,
      content: populated.content,
      author: {
        id: populated.author._id,
        name: populated.author.name,
        role: populated.author.role,
        avatar_url: populated.author.avatarUrl
      },
      parent_reply_id: populated.parentReply || null,
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create reply', error: error.message });
  }
});

// POST /forums/replies/:id/like - Like a reply
router.post('/replies/:id/like', authToken, async (req, res) => {
  try {
    const reply = await ForumReply.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const isLiked = reply.likes.some(like => like.equals(req.user._id));

    if (isLiked) {
      reply.likes = reply.likes.filter(like => !like.equals(req.user._id));
    } else {
      reply.likes.push(req.user._id);
    }

    await reply.save();

    res.json({ liked: !isLiked, likes: reply.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Unable to like reply', error: error.message });
  }
});

// POST /forums/:id/pin - Pin a post (admin/faculty only)
router.post('/:id/pin', authToken, roleCheck('faculty', 'admin'), async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({ is_pinned: post.isPinned });
  } catch (error) {
    res.status(500).json({ message: 'Unable to pin post', error: error.message });
  }
});

// DELETE /forums/:id - Delete a forum post
router.delete('/:id', authToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the author or admin can delete this post' });
    }

    await ForumReply.deleteMany({ post: post._id });
    await ForumPost.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete post', error: error.message });
  }
});

module.exports = router;

