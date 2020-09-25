const dependencies = {
    get InsertBuilder() {
        const CustomInsertBuilder = require('./CustomInsertBuilder')
        Object.defineProperty(dependencies, 'InsertBuilder', { value: CustomInsertBuilder })
        return CustomInsertBuilder
    },
    get ExpressionBuilder() {
        const CustomExpressionBuilder = require('./CustomExpressionBuilder')
        Object.defineProperty(dependencies, 'ExpressionBuilder', { value: CustomExpressionBuilder })
        return CustomExpressionBuilder
    },
    get SelectBuilder() {
        const CustomSelectBuilder = require('./CustomSelectBuilder')
        Object.defineProperty(dependencies, 'SelectBuilder', { value: CustomSelectBuilder })
        return CustomSelectBuilder
    },
    get ReferenceBuilder() {
        const CustomReferenceBuilder = require('./CustomReferenceBuilder')
        Object.defineProperty(dependencies, 'ReferenceBuilder', { value: CustomReferenceBuilder })
        return CustomReferenceBuilder
    },
    get UpdateBuilder() {
        const CustomUpdateBuilder = require('./CustomUpdateBuilder')
        Object.defineProperty(dependencies, 'UpdateBuilder', { value: CustomUpdateBuilder })
        return CustomUpdateBuilder
    },
    get DeleteBuilder() {
        const CustomDeleteBuilder = require('./CustomDeleteBuilder')
        Object.defineProperty(dependencies, 'DeleteBuilder', { value: CustomDeleteBuilder })
        return CustomDeleteBuilder
    },
    get QuoteReferenceBuilder() {
        const CustomQuoteReferenceBuilder = require('./CustomQuoteReferenceBuilder')
        Object.defineProperty(dependencies, 'QuoteReferenceBuilder', { value: CustomQuoteReferenceBuilder })
        return CustomQuoteReferenceBuilder
    },
}

module.exports = dependencies
