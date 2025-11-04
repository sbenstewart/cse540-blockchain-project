# Decentralized IAM dApp for Secure Medical Records

Project for CSE540 - Group 21

## Overview

This repository contains a decentralized application (dApp) that manages medical records using Ethereum smart contracts and IPFS for off-chain encrypted storage. The dApp gives patients control over their records and enables fine-grained sharing (grant/revoke) to other Ethereum addresses (e.g., doctors).

## Status

- Smart Contract: `MedicalRecordsContract.sol` (Solidity) — core logic for adding records, reading records, and managing access is implemented.
- Local Deployment: tested on a local Ganache instance.
- Testing: functions were validated using Truffle tests/console for the add/grant/revoke lifecycle.

## Table of Contents

- [Overview](#overview)
- [Status](#status)
- [Core Dependencies](#core-dependencies)
- [Local Setup](#local-setup)
- [Truffle Configuration & Migration](#truffle-configuration--migration)
- [How to Deploy and Test Locally](#how-to-deploy-and-test-locally)
- [MetaMask Setup](#metamask-setup)
- [Usage](#usage)
- [Future Development](#future-development)
- [Contributing](#contributing)
- [License](#license)

## Core Dependencies

- Node.js (v18.x or higher)
- npm
- Truffle Suite (install globally if desired)
- Ganache (desktop recommended)
- MetaMask (browser extension)

Install Truffle globally (optional):

```bash
npm install -g truffle
```

## Local Setup

1. Clone the repository and change into it:

```bash
git clone <your-repository-url>
cd <project-directory>
```

2. If the project has a frontend and contracts in separate folders, install dependencies accordingly. Example paths used below are `client` for frontend and `contracts`/`truffle` for contracts. Adjust as needed.

Frontend (example):

```bash
cd client || cd frontend || true
npm install
```

Contracts (example):

```bash
cd ../contracts || cd ../truffle || true
npm install
```

## Truffle Configuration & Migration

Edit `truffle-config.js` to point to your Ganache instance and set the compiler version. Example configuration:

```js
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Ganache default
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
    },
  },
};
```

Create a migration script file (e.g. `migrations/2_deploy_medical_records.js`):

```js
const MedicalRecordsContract = artifacts.require("MedicalRecordsContract");

module.exports = function (deployer) {
  deployer.deploy(MedicalRecordsContract);
};
```

## How to Deploy and Test Locally

1. Start Ganache (desktop or CLI) — Ganache typically runs at `http://127.0.0.1:7545`.

2. Compile contracts:

```bash
truffle compile
```

3. Run migrations to deploy to the local network:

```bash
truffle migrate --network development
```

You should see the deployment output and contract address.

## MetaMask Setup

To interact with the dApp locally:

1. Open MetaMask and add a Custom RPC network with:

- RPC URL: `http://127.0.0.1:7545` (Ganache)
- Chain ID: (use Ganache's chain id, default is `1337` or `5777` depending on Ganache version)

2. Import an account from Ganache using a private key shown in Ganache's accounts list.

## Usage

Typical flow:

1. Connect your MetaMask wallet to the dApp.
2. Encrypt a medical file in-browser and upload it to IPFS.
3. Store the IPFS CID and metadata (file type, timestamp) in the `MedicalRecordsContract` via a transaction.
4. Grant access to another address (doctor), who can then fetch the CID and retrieve the file (after decryption if appropriate keys are shared).

### Demo with Truffle Console

This is the best way to demonstrate the core logic of the smart contract (this method does not use MetaMask).

Connect to your deployed contract:

```bash
truffle console --network development
```

Get your accounts and contract instance:

```js
// Inside the truffle console
let accounts = await web3.eth.getAccounts()
let patientAccount = accounts[0]
let doctorAccount = accounts[1]
let instance = await MedicalRecordsContract.deployed()
```

Demo: Patient adds a record:

```js
await instance.addRecord("QmHash_A1", "Blood Test Results", { from: patientAccount })
await instance.getMyRecords({ from: patientAccount })
```

Demo: Patient grants access to the doctor:

```js
// Grant access to the first record (index 0)
await instance.grantAccess(doctorAccount, 0, { from: patientAccount })
```

Demo: Doctor views their shared records:

```js
let sharedDocs = await instance.getSharedRecords(patientAccount, { from: doctorAccount })
console.log(sharedDocs) // This will show the "Blood Test Results"
```

Demo: Patient revokes access:

```js
await instance.revokeAccess(doctorAccount, 0, { from: patientAccount })
let sharedDocs = await instance.getSharedRecords(patientAccount, { from: doctorAccount })
console.log(sharedDocs) // This will show an empty array []
```

### Smart Contract Components

The contract `MedicalRecordsContract.sol` is fully documented with high-level comments explaining the functionality of each component.

**State Variables:**
- `patientRecords`: A mapping from a patient's address to an array of Record structs.
- `accessPermissions`: A nested mapping storing which record indices a viewer can access from a patient.
- `hasAccess`: A lookup mapping to efficiently check if access is already granted.

**Structs:**
- `Record`: A struct that defines the metadata for a medical file.

```solidity
struct Record {
    string ipfsHash;
    string fileType;
    uint256 timestamp;
}
```

**Core Functions:**

- `addRecord(string memory _ipfsHash, string memory _fileType)`: Adds a new record to the caller's (patient's) list.
- `getMyRecords() view returns (Record[] memory)`: Returns all records owned by the caller (patient).
- `grantAccess(address _viewerAddress, uint256 _recordIndex)`: Allows the caller (patient) to grant access to one record.
- `revokeAccess(address _viewerAddress, uint256 _recordIndex)`: Allows the caller (patient) to revoke access to one record.
- `getSharedRecords(address _patientAddress) view returns (Record[] memory)`: Allows a caller (doctor) to view records shared by a specific patient.

## Future Development

### Next Steps

- **IPFS Integration**: Set up an IPFS node or use a pinning service (like Pinata) to handle the actual file uploads.
- **React Frontend**: Build the user interface as described in the project proposal, allowing users to connect with MetaMask, upload files, and manage their medical records through a web interface.

## Contributing

Contributions welcome. Please open an issue or submit a PR with clear details.

## License

See the `LICENSE` file in this repository for license information.