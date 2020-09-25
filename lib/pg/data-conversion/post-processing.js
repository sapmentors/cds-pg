
const { getPostProcessMapper } = require('@sap/cds-runtime/lib/db/data-conversion/post-processing')

const _refs = (refs, as) => {
  const arr = []

  for (const element of refs) {
    // multiple join are nested, so we need to find all the table names in there as well
    if (element.hasOwnProperty('join')) {
      arr.push(..._extractRefs(element))
      // Likely a union
    } else if (element.hasOwnProperty('SELECT')) {
      arr.push(..._extractRefs(element.SELECT.from, as))
    } else {
      arr.push(element)
    }
  }
  return arr
}

const _extractRefs = (from, as) => {
  if (from.SELECT) {
    return _extractRefs(from.SELECT.from, from.SELECT.as)
  }

  if (from.hasOwnProperty('join')) {
    // cqn with join in from
    return _refs(from.args)
  }

  if (from.hasOwnProperty('SET')) {
    return _refs(from.SET.args, from.SET.as || from.as)
  }

  const ref = { ref: from.ref, as: from.as }

  if (as) {
    ref.as = as
  }

  return [ref]
}




const _getCombineStructureConvert = (structure, columnName, propName, fn) => {
  const length = structure.length

  return row => {
    if (row[columnName] === undefined) {
      return
    }

    if (!row[structure[0]]) {
      row[structure[0]] = {}
    }

    let subObj = row[structure[0]]

    for (let i = 1; i < length; i++) {
      subObj = subObj[structure[i]] = {}
    }

    subObj[propName] = fn ? fn(row[columnName]) : row[columnName]

    delete row[columnName]
  }
}

const _getCombineRenameConvert = (columnName, propName, fn) => {
  return row => {
    if (row[propName] === undefined) {
      return
    }

    row[propName] = fn ? fn(row[columnName]) : row[columnName]
    delete row[columnName]
  }
}

const _getConvert = (columnName, fn) => {
  return row => {
    row[columnName] = fn(row[columnName])
  }
}

const _getRemoveMapper = (mapper, propName) => {
  if (mapper) {
    const fn = mapper.get(propName)
    mapper.delete(propName)

    return fn
  }
}

const _propertyMapper = (dataMapper, propertyMapper, objStructMapper, mapper) => {
  if (!propertyMapper) {
    return
  }

  for (const [columnName, propName] of propertyMapper.entries()) {
    const fn = _getRemoveMapper(dataMapper, propName)
    const structure = _getRemoveMapper(objStructMapper, propName)

    mapper.push(
      structure
        ? _getCombineStructureConvert(structure, columnName, propName, fn)
        : _getCombineRenameConvert(columnName, propName, fn)
    )
  }
}

const _objStructMapper = (dataMapper, propertyMapper, objStructMapper, mapper) => {
  if (!objStructMapper) {
    return
  }

  for (const [propName, structure] of objStructMapper.entries()) {
    mapper.push(_getCombineStructureConvert(structure, propName, propName, _getRemoveMapper(dataMapper, propName)))
  }
}

const _dataMapper = (dataMapper, propertyMapper, objStructMapper, mapper) => {
  if (!dataMapper) {
    return
  }

  for (const [columnName, converter] of dataMapper.entries()) {
    mapper.push(_getConvert(columnName, converter))
  }
}

/**
 * Generate the mapper per row up front, so that we do not have to iterate over possibly three mappers
 * @param dataMapper
 * @param propertyMapper
 * @param objStructMapper
 * @returns {Array}
 * @private
 */
const _combineMappers = (dataMapper, propertyMapper, objStructMapper) => {
  const mapper = []

  // Technical names + optionally structure and/or type conversions
  _propertyMapper(dataMapper, propertyMapper, objStructMapper, mapper)

  // Deep structures + optionally type conversions
  _objStructMapper(dataMapper, propertyMapper, objStructMapper, mapper)

  // type conversion
  _dataMapper(dataMapper, propertyMapper, objStructMapper, mapper)

  return mapper
}

const _processRow = (mapper, mapperCount, row) => {
  // REVISIT: when is this the case?
  if (!row) return

  for (let i = 0; i < mapperCount; i++) {
    mapper[i](row)
  }
}

/**
 * Post process the result as given by the db driver.
 * @param {*} result - The result as returned by the db driver.
 * @param {Map} dataMapper - Instructions, how to transform.
 * @param {Map} propertyMapper - Instructions, how to rename properties.
 * @param {Map} objStructMapper - Instructions, how to rename properties.
 * @returns {*}
 * @private
 */
const postProcess = (result, dataMapper, propertyMapper, objStructMapper) => {
  const mapper = _combineMappers(dataMapper, propertyMapper, objStructMapper)
  const mapperCount = mapper.length

  if (mapperCount === 0) {
    return result
  }

  if (Array.isArray(result)) {
    for (let i = 0, length = result.length; i < length; i++) {
      _processRow(mapper, mapperCount, result[i])
    }
  } else {
    _processRow(mapper, mapperCount, result)
  }

  return result
}

const _isAssocOrCompEntity = (csn, entity, element) => {
  return (
    csn.definitions[entity] &&
    csn.definitions[entity].elements[element] &&
    (csn.definitions[entity].elements[element].type === 'cds.Association' ||
      csn.definitions[entity].elements[element].type === 'cds.Composition')
  )
}

const _checkExpressionsAmbiguousNaming = (csn, entity, element) => {
  if (!entity.as || !Array.isArray(element.ref)) {
    return
  }

  if (
    entity.as === element.ref[0] &&
    csn.definitions[entity.ref[0]] &&
    csn.definitions[entity.ref[0]].elements[element.ref[1]] &&
    _isAssocOrCompEntity(csn, entity.ref[0], element.ref[0])
  ) {
    throw new Error(`Ambiguous entity property and alias name: "${entity.as}"`)
  }
}

const _checkColumnsAmbiguousNaming = (csn, entity, columns) => {
  for (const element of columns) {
    _checkExpressionsAmbiguousNaming(csn, entity, element)
  }
}

const _checkJoinAmbiguousNaming = (csn, select) => {
  for (const subSelect of select.from.args) {
    if (Array.isArray(select.columns)) {
      _checkColumnsAmbiguousNaming(csn, subSelect, select.columns)
    }
  }
}

const _checkSelectAmbiguousNaming = (csn, select) => {
  if (Array.isArray(select.columns)) {
    _checkColumnsAmbiguousNaming(csn, select.from, select.columns)
  }
}

const _checkRecursiveSelectAmbiguousNaming = (csn, select) => {
  if (select.from.SELECT) {
    _checkRecursiveSelectAmbiguousNaming(csn, select.from.SELECT)
  } else if (select.from.join) {
    _checkJoinAmbiguousNaming(csn, select)
  } else if (select.from.as) {
    // Check innermost select statement
    _checkSelectAmbiguousNaming(csn, select)
  }
}





module.exports = {
  getPostProcessMapper,
  postProcess
}
