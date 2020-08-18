// taken straight from
// https://github.com/facebook/jest/issues/7480#issuecomment-492976544
// with some minor bugfixes added

const os = require('os')
const path = require('path')

module.exports = async () => {
  const extensions = {
    darwin: 'dylib',
    linux: 'so',
    win32: 'dll',
  }

  // Look for prebuilt binary and DBCAPI based on platform
  let pb_subdir = null
  if (process.platform === 'linux') {
    if (process.arch === 'x64') {
      pb_subdir = 'linuxx86_64-gcc48'
    } else if (process.arch.toLowerCase().indexOf('ppc') != -1 && os.endianness() === 'LE') {
      pb_subdir = 'linuxppc64le-gcc48'
    } else {
      pb_subdir = 'linuxppc64-gcc48'
    }
  } else if (process.platform === 'win32') {
    pb_subdir = 'ntamd64-msvc2010'
  } else if (process.platform === 'darwin') {
    pb_subdir = 'darwinintel64-xcode7'
  }

  const modpath = path.dirname(require.resolve('@sap/hana-client/README.md'))
  const pb_path = path.join(modpath, 'prebuilt', pb_subdir)
  const dbcapi = process.env['DBCAPI_API_DLL'] || path.join(pb_path, 'libdbcapiHDB.' + extensions[process.platform])

  process.env['DBCAPI_API_DLL'] = dbcapi
}
