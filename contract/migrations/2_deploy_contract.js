var SupplyChain = artifacts.require("./SupplyChain.sol");

module.exports = function(_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(SupplyChain);
};
