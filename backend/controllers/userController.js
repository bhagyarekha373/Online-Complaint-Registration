import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (admin)
export const getUsers = async (req, res) => {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  return res.json(users);
};

// @desc    Get all agents (used for assignment dropdowns)
// @route   GET /api/users/agents
// @access  Private (admin)
export const getAgents = async (req, res) => {
  const agents = await User.find({ role: 'agent' }).select('name email');
  return res.json(agents);
};

// @desc    Update a user's role
// @route   PUT /api/users/:id/role
// @access  Private (admin)
export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'agent', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.role = role;
  await user.save();
  return res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (admin)
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  await user.deleteOne();
  return res.json({ message: 'User removed' });
};
