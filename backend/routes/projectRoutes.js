// routes/projectRoutes.js - Routes for project matchmaking
const express = require('express');
const mongoose = require('mongoose');
const { authToken } = require('../middleware/authMiddleware');
const Project = require('../model/Project');
const ProjectApplication = require('../model/ProjectApplication');
const ChatRoom = require('../model/ChatRoom');

const router = express.Router();

// GET /projects - Get all projects
router.get('/', authToken, async (req, res) => {
  try {
    const { type, status, search, hackathonId } = req.query;
    const filter = {};

    if (type) filter.projectType = type;
    if (status) filter.status = status;
    if (hackathonId) filter.hackathonId = hackathonId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const projects = await Project.find(filter)
      .populate('creator', 'name email role avatarUrl')
      .populate('teamMembers.user', 'name email role avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(projects.map(project => ({
      id: project._id,
      title: project.title,
      description: project.description,
      creator: {
        id: project.creator._id,
        name: project.creator.name,
        email: project.creator.email,
        role: project.creator.role,
        avatar_url: project.creator.avatarUrl
      },
      team_members: project.teamMembers.map(m => ({
        user: {
          id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          role: m.user.role,
          avatar_url: m.user.avatarUrl
        },
        role: m.role,
        joined_at: m.joinedAt
      })),
      team_size: project.teamMembers.length,
      max_team_size: project.maxTeamSize,
      required_skills: project.requiredSkills,
      project_type: project.projectType,
      status: project.status,
      hackathon_id: project.hackathonId,
      tags: project.tags,
      repository_url: project.repositoryUrl,
      demo_url: project.demoUrl,
      deadline: project.deadline,
      created_at: project.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load projects', error: error.message });
  }
});

// GET /projects/:id - Get a specific project
router.get('/:id', authToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'name email role avatarUrl')
      .populate('teamMembers.user', 'name email role avatarUrl');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has applied
    const application = await ProjectApplication.findOne({
      project: project._id,
      applicant: req.user._id
    });

    res.json({
      id: project._id,
      title: project.title,
      description: project.description,
      creator: {
        id: project.creator._id,
        name: project.creator.name,
        email: project.creator.email,
        role: project.creator.role,
        avatar_url: project.creator.avatarUrl
      },
      team_members: project.teamMembers.map(m => ({
        user: {
          id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          role: m.user.role,
          avatar_url: m.user.avatarUrl
        },
        role: m.role,
        joined_at: m.joinedAt
      })),
      team_size: project.teamMembers.length,
      max_team_size: project.maxTeamSize,
      required_skills: project.requiredSkills,
      project_type: project.projectType,
      status: project.status,
      hackathon_id: project.hackathonId,
      tags: project.tags,
      repository_url: project.repositoryUrl,
      demo_url: project.demoUrl,
      deadline: project.deadline,
      created_at: project.createdAt,
      has_applied: !!application,
      application_status: application?.status || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load project', error: error.message });
  }
});

// POST /projects - Create a new project
router.post('/', authToken, async (req, res) => {
  try {
    const {
      title,
      description,
      maxTeamSize,
      requiredSkills,
      projectType,
      hackathonId,
      tags,
      repositoryUrl,
      demoUrl,
      deadline
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const project = await Project.create({
      title,
      description,
      creator: req.user._id,
      maxTeamSize: maxTeamSize || 5,
      requiredSkills: requiredSkills || [],
      projectType: projectType || 'hackathon',
      hackathonId: hackathonId || null,
      tags: tags || [],
      repositoryUrl: repositoryUrl || '',
      demoUrl: demoUrl || '',
      deadline: deadline || null,
      teamMembers: [{
        user: req.user._id,
        role: 'leader',
        joinedAt: new Date()
      }]
    });

    // Create a chat room for the project
    await ChatRoom.create({
      name: `${title} Chat`,
      description: `Chat room for ${title}`,
      project: project._id,
      roomType: 'project',
      members: [req.user._id],
      createdBy: req.user._id
    });

    const populated = await Project.findById(project._id)
      .populate('creator', 'name email role avatarUrl')
      .populate('teamMembers.user', 'name email role avatarUrl');

    res.status(201).json({
      id: populated._id,
      title: populated.title,
      description: populated.description,
      creator: {
        id: populated.creator._id,
        name: populated.creator.name
      },
      team_size: populated.teamMembers.length,
      max_team_size: populated.maxTeamSize,
      status: populated.status,
      created_at: populated.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create project', error: error.message });
  }
});

// POST /projects/:id/apply - Apply to join a project
router.post('/:id/apply', authToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'recruiting') {
      return res.status(400).json({ message: 'Project is not accepting applications' });
    }

    if (project.teamMembers.some(m => m.user.equals(req.user._id))) {
      return res.status(400).json({ message: 'You are already a team member' });
    }

    if (project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({ message: 'Project team is full' });
    }

    const existingApplication = await ProjectApplication.findOne({
      project: project._id,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this project' });
    }

    const { message, skills } = req.body;

    const application = await ProjectApplication.create({
      project: project._id,
      applicant: req.user._id,
      message: message || '',
      skills: skills || []
    });

    res.status(201).json({
      id: application._id,
      message: 'Application submitted successfully',
      status: application.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to submit application', error: error.message });
  }
});

// GET /projects/:id/applications - Get applications for a project (creator only)
router.get('/:id/applications', authToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the project creator can view applications' });
    }

    const applications = await ProjectApplication.find({ project: project._id })
      .populate('applicant', 'name email role avatarUrl department')
      .sort({ createdAt: -1 });

    res.json(applications.map(app => ({
      id: app._id,
      applicant: {
        id: app.applicant._id,
        name: app.applicant.name,
        email: app.applicant.email,
        role: app.applicant.role,
        avatar_url: app.applicant.avatarUrl,
        department: app.applicant.department
      },
      message: app.message,
      skills: app.skills,
      status: app.status,
      created_at: app.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load applications', error: error.message });
  }
});

// POST /projects/:id/applications/:applicationId/accept - Accept an application
router.post('/:id/applications/:applicationId/accept', authToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the project creator can accept applications' });
    }

    if (project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({ message: 'Project team is full' });
    }

    const application = await ProjectApplication.findById(req.params.applicationId);

    if (!application || !application.project.equals(project._id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been processed' });
    }

    // Add user to team
    project.teamMembers.push({
      user: application.applicant,
      role: 'member',
      joinedAt: new Date()
    });
    await project.save();

    // Update application status
    application.status = 'accepted';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Add user to chat room
    const chatRoom = await ChatRoom.findOne({ project: project._id });
    if (chatRoom && !chatRoom.members.some(m => m.equals(application.applicant))) {
      chatRoom.members.push(application.applicant);
      await chatRoom.save();
    }

    // Reject other pending applications if team is full
    if (project.teamMembers.length >= project.maxTeamSize) {
      await ProjectApplication.updateMany(
        { project: project._id, status: 'pending' },
        { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date() }
      );
    }

    res.json({ message: 'Application accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to accept application', error: error.message });
  }
});

// POST /projects/:id/applications/:applicationId/reject - Reject an application
router.post('/:id/applications/:applicationId/reject', authToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the project creator can reject applications' });
    }

    const application = await ProjectApplication.findById(req.params.applicationId);

    if (!application || !application.project.equals(project._id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'rejected';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    res.json({ message: 'Application rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to reject application', error: error.message });
  }
});

// DELETE /projects/:id - Delete a project (creator only)
router.delete('/:id', authToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the creator can delete the project' });
    }

    await ProjectApplication.deleteMany({ project: project._id });
    await ChatRoom.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete project', error: error.message });
  }
});

module.exports = router;

