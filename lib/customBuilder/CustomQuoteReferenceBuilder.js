const { ReferenceBuilder } = require('@sap/cds-runtime/lib/db/sql-builder/');
const Placeholder = require('../utils/Placeholder');

class CustomQuoteReferenceBuilder extends ReferenceBuilder {
    get FunctionBuilder() {
        const FunctionBuilder = require('./CustomFunctionBuilder')
        Object.defineProperty(this, 'FunctionBuilder', { value: FunctionBuilder })
        return FunctionBuilder
    }


    /**
     * Override method and add "AS" part do the column name so that it matches the CDS model
     * @param {*} refArray 
     */
    _parseReference(refArray) {
        console.log(refArray);
        if (refArray[0].id) {
            throw new Error(`${refArray[0].id}: Views with parameters supported only on HANA`)
        }
        this._outputObj.sql.push(refArray.map(el => `${this._quoteElement(el)} AS "${el}"`).join('.'))
    }
}

module.exports = CustomQuoteReferenceBuilder
