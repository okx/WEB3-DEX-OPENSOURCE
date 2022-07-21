const { network } = require('hardhat');

const okc  = require('./okc')
const bsc  = require('./bsc')
const eth  = require('./eth')
const avax = require('./avax')
const arbitrum = require('./arbitrum')
const op = require('./op')
const ftm = require('./ftm')



let config

if (network == "okc") {
  config = okc
} else if (network == "bsc") {
  config = bsc
} else if (network == "eth") {
  config = eth
} else if (network == 'avax') {
  config = avax
} else if (network == 'arbitrum') {
  config = arbitrum
} else if (network == 'op') {
  config = op
} else if (network == 'ftm') {
  config = ftm
} else {
  config = eth
}

const getConfig = function (network) {
  if (network == "okc") {
    return okc
  } else if (network == "bsc") {
    return bsc
  } else if (network == "eth") { 
    return eth
  } else if (network=='avax') {
    return avax
  } else if (network == 'arbitrum') {
    return arbitrum
  } else if (network == 'op') {
    return op
  } else if (network == 'ftm') {
    return ftm
  }else {
    throw error("network not config")
  }
}

module.exports = {
  getConfig,
  config
}
