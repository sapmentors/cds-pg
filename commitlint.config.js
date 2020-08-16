/* eslint-disable quote-props */
module.exports = { extends: ['@commitlint/config-conventional'], ignores: [(message) => message.includes('wip')] }
