const wrapper = require('./db-sqlite');

// Export wrapper directly, as server/index.js expects pool.promise() like object
// wrapper.promise() returns 'this' so it works.
module.exports = wrapper;
