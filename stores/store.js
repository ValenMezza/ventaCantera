const mode = (process.env.STORE || 'memory').toLowerCase();

let store;
if (mode === 'db') store = require('./dbStore');
else store = require('./memoryStore');

module.exports = store;
