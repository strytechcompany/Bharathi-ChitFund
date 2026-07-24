const FPaymentTeam = require('../models/FPaymentTeam');

const notFound = () => {
  const error = new Error('FPaymentTeam not found');
  error.statusCode = 404;
  return error;
};

const getAll = async () =>
  FPaymentTeam.find().populate('schemeId', 'name amount tier durationMonths').sort({ createdAt: -1 });

const getById = async (id) => {
  const team = await FPaymentTeam.findById(id).populate('schemeId', 'name amount tier durationMonths');
  if (!team) throw notFound();
  return team;
};

const create = async (data) => FPaymentTeam.create(data);

const update = async (id, data) => {
  const team = await FPaymentTeam.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!team) throw notFound();
  return team;
};

const remove = async (id) => {
  const team = await FPaymentTeam.findByIdAndDelete(id);
  if (!team) throw notFound();
  return team;
};

const addMember = async (id, memberData) => {
  const team = await FPaymentTeam.findById(id);
  if (!team) throw notFound();
  team.members.push(memberData);
  await team.save();
  return team;
};

const updateMember = async (id, memberId, memberData) => {
  const team = await FPaymentTeam.findById(id);
  if (!team) throw notFound();
  const member = team.members.id(memberId);
  if (!member) throw notFound();
  Object.assign(member, memberData);
  await team.save();
  return team;
};

const removeMember = async (id, memberId) => {
  const team = await FPaymentTeam.findById(id);
  if (!team) throw notFound();
  team.members = team.members.filter(m => m._id.toString() !== memberId);
  await team.save();
  return team;
};

module.exports = { getAll, getById, create, update, remove, addMember, updateMember, removeMember };
