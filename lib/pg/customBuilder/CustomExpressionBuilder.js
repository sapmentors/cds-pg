const { ExpressionBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../../utils/Placeholder');

class CustomExpressionBuilder extends ExpressionBuilder {
    get ReferenceBuilder() {
        const ReferenceBuilder = require('./CustomReferenceBuilder')
        Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
        return ReferenceBuilder
    }

    get SelectBuilder() {
        const SelectBuilder = require('./CustomSelectBuilder')
        Object.defineProperty(this, 'SelectBuilder', { value: SelectBuilder })
        return SelectBuilder
    }

    get FunctionBuilder() {
        const FunctionBuilder = require('./CustomFunctionBuilder')
        Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
        return FunctionBuilder
    }

    /**
     * Instead of adding the value to the SQL via string literal or string concat, add a placeholder instead.
     * The placeholder is than used by a db driver and prepared statements to defend against injections.
     * @override
     * @param {Object} element
     * @private
     */
    _valOutputFromElement(element) {
        this._outputObj.sql.push(Placeholder.increment())
        this._outputObj.values.push(element.val)
    }
}

module.exports = CustomExpressionBuilder
