const Team = require('../models/Team');
const Member = require('../models/Member');

const getAll = async (req, res) => {
  try {
    const filter = req.query.chitScheme ? { chitScheme: req.query.chitScheme } : {};
    const teams = await Team.find(filter).populate('chitScheme', 'name amount tier').sort({ createdAt: -1 });

    const teamsWithCount = await Promise.all(
      teams.map(async (t) => {
        const memberCount = await Member.countDocuments({ team: t._id, status: 'active' });
        return { ...t.toObject(), currentMembers: memberCount };
      })
    );

    res.json({ success: true, data: teamsWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('chitScheme');
    if (!team) return res.status(404).json({ success: false, message: 'Not found' });
    const memberCount = await Member.countDocuments({ team: team._id, status: 'active' });
    res.json({ success: true, data: { ...team.toObject(), currentMembers: memberCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!team) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
