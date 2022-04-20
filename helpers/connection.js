const PORT = process.env.PORT || 8080;

module.exports = (app) => {
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line
    console.log("Server is on PORT: ", server.address().port);
  });

  return server;
};
