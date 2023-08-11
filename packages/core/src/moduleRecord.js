
/**
 * @typedef LavamoatModuleRecordOpts
 * @property {string} specifier
 * @property {any} file
 * @property {string} packageName
 * @property {string} content
 * @property {Record<string, string>} [importMap]
 * @property {any} [ast]
 * @property {any} [moduleInitializer]
 */

class LavamoatModuleRecord {
  /**
   *
   * @param {LavamoatModuleRecordOpts} opts
   */
  constructor ({
    specifier,
    file,
    type,
    packageName,
    content,
    importMap = {},
    ast,
    moduleInitializer,
  }) {
    this.specifier = specifier
    this.file = file
    this.type = type
    this.packageName = packageName
    this.content = content
    this.importMap = importMap
    this.ast = ast
    this.moduleInitializer = moduleInitializer
  }
}

module.exports = { LavamoatModuleRecord }
