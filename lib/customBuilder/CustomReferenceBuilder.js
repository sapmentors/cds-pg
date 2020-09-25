const { ReferenceBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');

class CustomReferenceBuilder extends ReferenceBuilder {
    get FunctionBuilder() {
        const FunctionBuilder = require('./CustomFunctionBuilder')
        Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
        return FunctionBuilder
    }
}

module.exports = CustomReferenceBuilder
