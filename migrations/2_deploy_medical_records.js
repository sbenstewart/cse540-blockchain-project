// This tells Truffle to find your contract
const MedicalRecordsContract = artifacts.require("MedicalRecordsContract");

module.exports = function (deployer) {
  // This tells Truffle to deploy it!
  deployer.deploy(MedicalRecordsContract);
};