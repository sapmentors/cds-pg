const { ReferenceBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../../utils/Placeholder');

class CustomReferenceBuilder extends ReferenceBuilder {
    get FunctionBuilder() {
        const FunctionBuilder = require('./CustomFunctionBuilder')
        Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
        return FunctionBuilder
    }

    _parseParamReference(refArray) {
        if (refArray[0] === '?') {
            this._outputObj.sql.push(Placeholder.increment())
        } else {
            this._outputObj.sql.push(Placeholder.increment())
            this._outputObj.values.push(refArray[0])
        }
    }
}

module.exports = CustomReferenceBuilder
