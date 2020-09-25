const { SelectBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../utils/Placeholder');

class CustomSelectBuilder extends SelectBuilder {

    get ReferenceBuilder() {
        const ReferenceBuilder = require('./CustomReferenceBuilder')
        Object.defineProperty(this, 'ReferenceBuilder', { value: ReferenceBuilder })
        return ReferenceBuilder
    }
    get ExpressionBuilder() {
        const ExpressionBuilder = require('./CustomExpressionBuilder')
        Object.defineProperty(this, 'ExpressionBuilder', { value: ExpressionBuilder })
        return ExpressionBuilder
    }
    get FunctionBuilder() {
        const FunctionBuilder = require('./CustomFunctionBuilder')
        Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
        return FunctionBuilder
    }
    get SelectBuilder() {
        const SelectBuilder = require('./CustomSelectBuilder')
        Object.defineProperty(this, 'SelectBuilder', { value: SelectBuilder })
        return SelectBuilder
    }

    get QuoteReferenceBuilder() {
        const QuoteReferenceBuilder = require('./CustomQuoteReferenceBuilder')
        Object.defineProperty(this, 'QuoteReferenceBuilder', { value: QuoteReferenceBuilder })
        return QuoteReferenceBuilder
    }

    /**
     * @override
     * @param {*} col 
     * @param {*} res 
     * @param {*} noQuoting 
     */
    _buildRefElement(col, res, noQuoting) {
        res = new this.QuoteReferenceBuilder(col, this._options, this._csn).build()
        return res
    }

    _limit() {
        this._outputObj.sql.push('LIMIT', Placeholder.increment())
        this._outputObj.values.push(this._obj.SELECT.one ? 1 : this._obj.SELECT.limit.rows.val)
        if (this._obj.SELECT.limit && this._obj.SELECT.limit.offset) {
            this._outputObj.sql.push('OFFSET', Placeholder.increment())
            this._outputObj.values.push(this._obj.SELECT.limit.offset.val)
        }
    }

}

module.exports = CustomSelectBuilder
