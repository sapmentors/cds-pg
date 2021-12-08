const moment = require('moment')

const convertToBoolean = (boolean) => {
  if (boolean === null) {
    return null
  }

  return Boolean(boolean)
}

const convertToDouble = (double) => {
  if (double === null) {
    return null
  }

  return Number.parseFloat(double)
}

const convertToDate = (date) => {
  if (date === null) {
    return null
  }

  const d = new Date(date + 'Z')
  return moment(d).format('YYYY-MM-DD')
}

const convertInt64ToString = (int64) => {
  if (int64 === null) {
    return null
  }

  return String(int64)
}

const convertToISO = (element) => {
  if (element) {
    return element.toISOString ? element.toISOString() : new Date(element + 'Z').toISOString()
  }

  return null
}

const convertToISONoMillis = (element) => {
  if (element) {
    const dateTime = element.toISOString ? element.toISOString() : new Date(element + 'Z').toISOString()
    return dateTime.slice(0, 19) + dateTime.slice(23)
  }

  return null
}

const convertToString = (element) => {
  if (element) {
    return element instanceof Buffer ? Buffer.from(element, 'base64').toString() : element
  }

  return null
}

const convertToBinary = (element) => {
  if (element) {
    return element instanceof Buffer ? element : Buffer.from(element, 'base64')
  }

  return null
}

const PG_TYPE_CONVERSION_MAP = new Map([
  ['cds.Boolean', convertToBoolean],
  ['cds.Integer64', convertInt64ToString],
  ['cds.DateTime', convertToISONoMillis],
  ['cds.Timestamp', convertToISO],
  ['cds.LargeString', convertToString],
  ['cds.Date', convertToDate],
  ['cds.Binary', convertToBinary],
  ['cds.LargeBinary', convertToBinary],
  ['cds.Double', convertToDouble],
])

module.exports = {
  PG_TYPE_CONVERSION_MAP,
}
