const ENDO_ROOT_POLICY = 'root'
const ENDO_WRITE_POLICY = 'write'
const ENDO_WILDCARD_POLICY = 'any'
const LAVAMOAT_ROOT_PKG = '<root>'
const LAVAMOAT_PKG_POLICY_ROOT = '$root$'

const RSRC_POLICY_PKGS = 'packages'
const RSRC_POLICY_BUILTINS = 'builtins'
const RSRC_POLICY_GLOBALS = 'globals'

const {isArray} = Array

/**
 * @typedef {typeof ENDO_ROOT_POLICY} RootPolicy
 * @typedef {typeof ENDO_WRITE_POLICY} WritePolicy
 */

/**
 * @typedef {import('@endo/compartment-mapper').Policy<RootPolicy>} LavaMoatEndoPolicy
 */

const DEFAULT_ATTENUATOR = '@lavamoat/endomoat/attenuator/default'
const PROPERTY_ATTENUATOR = '@lavamoat/endomoat/attenuator/property'

/**
 * @param {Record<string, boolean>} item - A value in `ResourcePolicy`
 */
function toEndoRsrcPkgsPolicyBuiltins(item) {
  /** @type {Exclude<import('@endo/compartment-mapper').PackagePolicy['builtins'], undefined>} */
  const policyItem = {}
  for (const [key, value] of Object.entries(item)) {
    if (key.includes('.')) {
      let [builtinName, ...rest] = key.split('.')
      let propName = rest.join('.')
      const itemForBuiltin = policyItem[builtinName]
      if (typeof itemForBuiltin === 'boolean') {
        throw new TypeError('Expected a FullAttenuationDefinition; got a boolean')
      }
      if (isArray(itemForBuiltin)) {
        throw new TypeError('Expected a FullAttenuationDefinition; got an array')
      }
      const otherParams = itemForBuiltin?.params ?? []
      policyItem[builtinName] = {
        attenuate: PROPERTY_ATTENUATOR,
        params: [...otherParams, propName],
      }
    } else {
      policyItem[key] = value
    }
  }
  return policyItem
}

/**
 * @param {Record<string, boolean>} item - A value in `ResourcePolicy`
 */
function toEndoRsrcPkgsPolicyPkgs(item) {
  /** @type {Exclude<import('@endo/compartment-mapper').PackagePolicy['packages'], undefined>} */
  const policyItem = {}
  for (const [key, value] of Object.entries(item)) {
    if (key === LAVAMOAT_PKG_POLICY_ROOT) {
      // unsure what to do here
    } else {
      policyItem[key] = value
    }
  }
  return policyItem
}


/**
 * @param {Record<string, boolean>} item - A value in `ResourcePolicy`
 */
function toEndoRsrcPkgsPolicyGlobals(item) {
  /** @type {Exclude<import('@endo/compartment-mapper').PackagePolicy['globals'], undefined>} */
  const policyItem = {}
  for (const [key, value] of Object.entries(item)) {
    policyItem[key] = value
  }
  return policyItem
}

/**
 *
 * @param {import('lavamoat-core/schema').ResourcePolicy} resources
 * @returns {import('@endo/compartment-mapper').PackagePolicy<RootPolicy>}
 */
function toEndoRsrcPkgsPolicy(resources)  {
  /** @type {import('@endo/compartment-mapper').PackagePolicy<RootPolicy>['packages']} */
  let packages
  /** @type {import('@endo/compartment-mapper').PackagePolicy<RootPolicy>['globals']} */
  let globals
  /** @type {import('@endo/compartment-mapper').PackagePolicy<RootPolicy>['builtins']} */
  let builtins

  if (resources.packages) {
    packages = toEndoRsrcPkgsPolicyPkgs(resources.packages)
  }

  if (resources.globals) {
    globals = toEndoRsrcPkgsPolicyGlobals(resources.globals)
  }

  if (resources.builtins) {
    builtins = toEndoRsrcPkgsPolicyBuiltins(resources.builtins)
  }

  return {packages, globals, builtins}

}

/**
 *
 * @param {import('lavamoat-core/schema').LavaMoatPolicySchema} lmPolicy
 * @returns {LavaMoatEndoPolicy}
 */
function toEndoPolicy(lmPolicy) {
  /** @type {LavaMoatEndoPolicy} */
  const endoPolicy = {
    defaultAttenuator: DEFAULT_ATTENUATOR,
    entry: {
      [RSRC_POLICY_GLOBALS]: [ENDO_ROOT_POLICY],
      [RSRC_POLICY_PKGS]: ENDO_WILDCARD_POLICY,
      [RSRC_POLICY_BUILTINS]: ENDO_WILDCARD_POLICY,
      noGlobalFreeze: true,
    },
    resources: {},
  }

  if (lmPolicy.resources) {
    for (const [rsrcName, rsrcPolicy] of Object.entries(lmPolicy.resources)) {
      if (rsrcName === LAVAMOAT_ROOT_PKG) {
        endoPolicy.entry = {...endoPolicy.entry, ...toEndoRsrcPkgsPolicy(rsrcPolicy)}
      } else {
        endoPolicy.resources[rsrcName] = toEndoRsrcPkgsPolicy(rsrcPolicy)
      }
    }
  }
  return endoPolicy
}

exports.toEndoPolicy = toEndoPolicy
exports.ROOT_POLICY = ENDO_ROOT_POLICY
exports.WRITE_POLICY = ENDO_WRITE_POLICY
exports.ANY_POLICY = ENDO_WILDCARD_POLICY
