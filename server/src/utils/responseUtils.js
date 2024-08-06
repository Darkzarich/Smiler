function sendSuccess(res, data) {
  const response = data || {
    ok: true,
  };

  // Providing for logs
  res.response = data;
  res.status(200).json(response);
}

module.exports = {
  sendSuccess,
};
