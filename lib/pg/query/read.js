const { hasExpand } = require('@sap/cds-runtime/lib/db/expand')
const { processExpand, processSimpleSQL } = require('../execute')



async function handleRead(dbc, cqn, model) {
    if (hasExpand(cqn)) {
        return processExpand(dbc, cqn, model);
    }

    return processSimpleSQL(dbc, cqn, model);
}

module.exports = handleRead;