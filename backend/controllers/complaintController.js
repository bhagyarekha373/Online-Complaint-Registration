import { validationResult } from 'express-validator';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

const populateFields = [
  { path: 'createdBy', select: 'name email' },
  { path: 'assignedTo', select: 'name email' },
];

// @desc    Create a complaint
// @route   POST /api/complaints
// @access  Private (user)
export const createComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category, priority, location } = req.body;

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority,
    location,
    createdBy: req.user._id,
  });

  return res.status(201).json(complaint);
};

// @desc    Get complaints (scoped by role)
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  const { status, category } = req.query;
  const filter = {};

  if (req.user.role === 'user') {
    filter.createdBy = req.user._id;
  } else if (req.user.role === 'agent') {
    filter.assignedTo = req.user._id;
  }
  // admin sees everything

  if (status) filter.status = status;
  if (category) filter.category = category;

  const complaints = await Complaint.find(filter)
    .populate(populateFields)
    .sort({ createdAt: -1 });

  return res.json(complaints);
};

// @desc    Get a single complaint
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(
    populateFields
  );

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  const isOwner = complaint.createdBy._id.equals(req.user._id);
  const isAssignedAgent =
    complaint.assignedTo && complaint.assignedTo._id.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAssignedAgent && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized to view this complaint' });
  }

  return res.json(complaint);
};

// @desc    Assign a complaint to an agent
// @route   PUT /api/complaints/:id/assign
// @access  Private (admin)
export const assignComplaint = async (req, res) => {
  const { agentId } = req.body;

  const agent = await User.findById(agentId);
  if (!agent || agent.role !== 'agent') {
    return res.status(400).json({ message: 'Invalid agent' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  complaint.assignedTo = agent._id;
  if (complaint.status === 'pending') complaint.status = 'assigned';
  await complaint.save();

  const updated = await complaint.populate(populateFields);
  return res.json(updated);
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (agent, admin)
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  const isAssignedAgent =
    complaint.assignedTo && complaint.assignedTo.equals(req.user._id);
  if (req.user.role !== 'admin' && !isAssignedAgent) {
    return res
      .status(403)
      .json({ message: 'Not authorized to update this complaint' });
  }

  complaint.status = status;
  await complaint.save();

  const updated = await complaint.populate(populateFields);
  return res.json(updated);
};

// @desc    Add a note / comment to a complaint
// @route   POST /api/complaints/:id/notes
// @access  Private
export const addNote = async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Note message is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  const isOwner = complaint.createdBy.equals(req.user._id);
  const isAssignedAgent =
    complaint.assignedTo && complaint.assignedTo.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAssignedAgent && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  complaint.notes.push({
    author: req.user._id,
    authorName: req.user.name,
    message: message.trim(),
  });
  await complaint.save();

  const updated = await complaint.populate(populateFields);
  return res.status(201).json(updated);
};

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
// @access  Private (owner while pending, or admin)
export const deleteComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  const isOwner = complaint.createdBy.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !(isOwner && complaint.status === 'pending')) {
    return res.status(403).json({ message: 'Not authorized to delete' });
  }

  await complaint.deleteOne();
  return res.json({ message: 'Complaint removed' });
};

// @desc    Dashboard statistics (scoped by role)
// @route   GET /api/complaints/stats/summary
// @access  Private
export const getStats = async (req, res) => {
  const match = {};
  if (req.user.role === 'user') match.createdBy = req.user._id;
  else if (req.user.role === 'agent') match.assignedTo = req.user._id;

  const byStatus = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats = {
    total: 0,
    pending: 0,
    assigned: 0,
    'in-progress': 0,
    resolved: 0,
    rejected: 0,
  };
  byStatus.forEach((s) => {
    stats[s._id] = s.count;
    stats.total += s.count;
  });

  return res.json(stats);
};
