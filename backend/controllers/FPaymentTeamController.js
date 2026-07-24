const fpaymentTeamService = require('../services/fpaymentTeamService');

const getAll = async (req, res) => {
  try {
    const teams = await fpaymentTeamService.getAll();
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const team = await fpaymentTeamService.getById(req.params.id);
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const team = await fpaymentTeamService.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const team = await fpaymentTeamService.update(req.params.id, req.body);
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await fpaymentTeamService.remove(req.params.id);
    res.json({ success: true, message: 'FPaymentTeam deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const addMember = async (req, res) => {
  try {
    const team = await fpaymentTeamService.addMember(req.params.id, req.body);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const updateMember = async (req, res) => {
  try {
    const team = await fpaymentTeamService.updateMember(req.params.id, req.params.memberId, req.body);
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const team = await fpaymentTeamService.removeMember(req.params.id, req.params.memberId);
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, addMember, updateMember, removeMember };
