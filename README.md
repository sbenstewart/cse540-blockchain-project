# Decentralized IAM dApp for Secure Medical Records

**CSE540 Blockchain Project - Group 21**

[**View Project Proposal**](documentation/Group21_Project_Proposal.pdf)

## Project Description

This decentralized application (dApp) revolutionizes medical record management by leveraging blockchain technology to give patients complete control over their health data. Built on Ethereum and IPFS, it addresses critical vulnerabilities in centralized healthcare systems:

**The Problem:** Traditional centralized medical record systems are vulnerable to data breaches, lack transparency, and deny patients meaningful control over their own health information.

**Our Solution:** A blockchain-based system where:
- Patients maintain full ownership and control of their medical records
- Encrypted files are stored on IPFS (decentralized storage)
- Smart contracts on Ethereum manage access permissions immutably
- Granular access control allows patients to grant/revoke access to specific records for specific healthcare providers
- All access events are transparent and auditable on the blockchain

**Key Features:**
- Patient-centric design with complete data sovereignty
- Secure, encrypted off-chain storage via IPFS
- Immutable access logs and permissions on Ethereum
- Flexible sharing: grant or revoke access to doctors, clinics, or other authorized parties
- Zero trust architecture: no central authority controls your data

## Current Implementation Status

**Smart Contract:** Complete and production-ready
- `MedicalRecordsContract.sol` (Solidity) implements all core functionality
- Supports adding records, retrieving records, and managing access permissions

**Local Testing:** Fully functional
- Successfully deployed and tested on Ganache (local Ethereum blockchain)
- All contract functions validated via Truffle console

**In Progress:**
- IPFS integration for actual file uploads
- React-based frontend interface
- Backend middleware for IPFS uploads

## Table of Contents

- [Project Description](#project-description)
- [Current Implementation Status](#current-implementation-status)
- [Prerequisites](#prerequisites)
- [Full Setup Guide](#full-setup-guide)
- [Using the Application](#using-the-application)
- [Smart Contract Documentation](#smart-contract-documentation)
- [Troubleshooting](#troubleshooting)
- [Future Development](#future-development)
- [Project Resources](#project-resources)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|-------------|
| **Node.js** | v18.x or higher | JavaScript runtime for development tools | [Download here](https://nodejs.org/) |
| **npm** | Comes with Node.js | Package manager | Included with Node.js |
| **Truffle Suite** | Latest | Ethereum development framework | `npm install -g truffle` |
| **Ganache** | Latest | Personal Ethereum blockchain | [Download desktop app](https://trufflesuite.com/ganache/) |
| **MetaMask** | Latest | Browser-based Ethereum wallet | [Chrome Extension](https://metamask.io/) |

### Quick Installation Commands

```bash
# Install Node.js (using Homebrew on macOS)
brew install node

# Install Truffle globally
npm install -g truffle

# Verify installations
node --version
npm --version
truffle version
```

## Full Setup Guide

This guide is split into two parts:
1.  **Blockchain Setup:** Compiling and deploying the smart contract to a local Ganache blockchain.
2.  **Application Setup:** Installing dependencies and running the backend and frontend servers.

### Part 1: Blockchain Setup

#### Step 1: Start Ganache

1. Open the Ganache desktop application
2. Click **"Quickstart Ethereum"** to create a new workspace
3. Your local blockchain will start at `http://127.0.0.1:7545`
4. Note: Ganache will create 10 test accounts, each with 100 ETH

![Ganache Blockchain](documentation/screenshots/ganache%20blockchain.png)

#### Step 2: Compile Smart Contracts

```bash
# From the project root directory
truffle compile
```

**Expected Output:**
```
Compiling your contracts...
===========================
✓ Fetching solc version list from solc-bin
✓ Downloading compiler
> Compiling ./contracts/MedicalRecordsContract.sol
> Artifacts written to /build/contracts
> Compiled successfully using:
   - solc: 0.8.19
```

#### Step 3: Deploy to Local Blockchain

```bash
# Deploy contracts to Ganache
truffle migrate --network development
```

**Expected Output:**
```
Starting migrations...
======================
> Network name:    'development'
> Network id:      5777
> Block gas limit: 6721975 (0x6691b7)

2_deploy_medical_records.js
============================

   Deploying 'MedicalRecordsContract'
   -----------------------------------
   > transaction hash:    0x...
   > contract address:    0x... (SAVE THIS ADDRESS!)
   > block number:        2
   > account:             0x...
   > balance:             99.99...
   > gas used:            ...
   > gas price:           ...
   > value sent:          0 ETH
   > total cost:          ... ETH

   > Saving artifacts
   -------------------------------------
   > Total cost:          ... ETH

Summary
=======
> Total deployments:   1
> Final cost:          ... ETH
```

![Truffle Migrate](documentation/screenshots/truffle%20migrate.png)

#### Step 4: Configure MetaMask

1. **Add Ganache Network to MetaMask:**
   - Open MetaMask extension in your browser
   - Click the network dropdown (usually shows "Ethereum Mainnet")
   - Select **"Add Network"** or **"Custom RPC"**
   - Enter the following details:
     ```
     Network Name: Ganache Local
     New RPC URL: http://127.0.0.1:7545
     Chain ID: 1337
     Currency Symbol: ETH
     ```
   - Click **"Save"**

#### Step 5: Set Up the Backend

The backend is an Express.js server that handles file uploads to IPFS.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the backend server:**
    ```bash
    npm start
    ```
    The server will start on port 5000.

#### Step 6: Set Up the Frontend

The frontend is a React application.

1.  **Open a new terminal** and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The application will open automatically in your browser at `http://localhost:3000`.

**Your dApp is now deployed and ready to use!**

## Using the Application

### Basic Workflow

Once deployed, the dApp enables the following workflow:

1. **Patient** connects their MetaMask wallet (authenticates via Ethereum address)
2. **Patient** encrypts a medical file locally in their browser
3. **Patient** uploads encrypted file to IPFS (returns a unique CID/hash)
4. **Patient** stores the IPFS hash and metadata in the smart contract via a transaction
5. **Patient** can grant access to specific records by authorizing a doctor's Ethereum address
6. **Doctor** can view only the records they've been granted access to
7. **Patient** can revoke access at any time

### Testing with Truffle Console

The easiest way to test the smart contract functionality is through the Truffle console:

#### 1. Open Truffle Console

```bash
truffle console --network development
```

#### 2. Set Up Test Accounts

```javascript
// Get all available accounts from Ganache
let accounts = await web3.eth.getAccounts()

// Assign roles for testing
let patientAccount = accounts[0]  // First account is the patient
let doctorAccount = accounts[1]   // Second account is the doctor

// Get deployed contract instance
let instance = await MedicalRecordsContract.deployed()

console.log("Patient address:", patientAccount)
console.log("Doctor address:", doctorAccount)
```

![Demo Accounts](documentation/screenshots/demo%20accounts.png)

#### 3. Patient Adds a Medical Record

```javascript
// Patient adds a new record with IPFS hash and file type
await instance.addRecord("QmHash_A1", "Blood Test Results", { from: patientAccount })

// Verify the record was added
let myRecords = await instance.getMyRecords({ from: patientAccount })
console.log("Patient's records:", myRecords)
```

![Blood Work Doc](documentation/screenshots/bllod%20work%20doc.png)

**Expected Output:**
```javascript
[
  [
    'QmHash_A1',
    'Blood Test Results',
    BigNumber { ... }, // timestamp
    ipfsHash: 'QmHash_A1',
    fileType: 'Blood Test Results',
    timestamp: BigNumber { ... }
  ]
]
```

#### 4. Patient Grants Access to Doctor

```javascript
// Grant doctor access to the first record (index 0)
await instance.grantAccess(doctorAccount, 0, { from: patientAccount })

console.log("Access granted to doctor!")
```

#### 5. Doctor Views Shared Records

```javascript
// Doctor queries records shared by the patient
let sharedRecords = await instance.getSharedRecords(patientAccount, { from: doctorAccount })
console.log("Doctor can see:", sharedRecords)
```

![Doctor Access](documentation/screenshots/doctor%20access.png)

**Expected Output:**
```javascript
[
  [
    'QmHash_A1',
    'Blood Test Results',
    BigNumber { ... },
    ipfsHash: 'QmHash_A1',
    fileType: 'Blood Test Results',
    timestamp: BigNumber { ... }
  ]
]
```

#### 6. Patient Revokes Access

```javascript
// Patient revokes doctor's access to the first record
await instance.revokeAccess(doctorAccount, 0, { from: patientAccount })

// Verify access was revoked
let sharedAfterRevoke = await instance.getSharedRecords(patientAccount, { from: doctorAccount })
console.log("After revocation:", sharedAfterRevoke) // Should be empty []
```

![No Access](documentation/screenshots/no%20access.png)

**Expected Output:**
```javascript
[] // Empty array - doctor has no access anymore
```

## Smart Contract Documentation

### Contract Overview: `MedicalRecordsContract.sol`

The smart contract is the core of this dApp, managing all medical record metadata and access permissions on the Ethereum blockchain. All contract code includes extensive inline comments for clarity.

### Architecture Components

#### 1. Data Structures

**Record Struct** - Stores metadata for each medical file:

```solidity
struct Record {
    string ipfsHash;      // IPFS content identifier (CID) pointing to encrypted file
    string fileType;      // Description of the medical record (e.g., "Blood Test", "X-Ray")
    uint256 timestamp;    // Unix timestamp when record was added
}
```

**Purpose:** The struct stores only metadata on-chain to minimize gas costs. The actual encrypted medical file is stored on IPFS, and the `ipfsHash` serves as a pointer to retrieve it.

#### 2. State Variables

```solidity
// Maps patient address to their array of medical records
mapping(address => Record[]) private patientRecords;

// Maps patient address → viewer address → array of accessible record indices
mapping(address => mapping(address => uint256[])) private accessPermissions;

// Quick lookup: patient → viewer → record index → boolean
mapping(address => mapping(address => mapping(uint256 => bool))) private hasAccess;
```

**Purpose:**
- `patientRecords`: Each patient owns an array of their medical records
- `accessPermissions`: Tracks which record indices a viewer (doctor) can access from a specific patient
- `hasAccess`: Provides O(1) lookup to check if access already exists, preventing duplicate permissions

#### 3. Core Functions (Interface)

##### `addRecord(string memory _ipfsHash, string memory _fileType)`

**Signature:**
```solidity
function addRecord(string memory _ipfsHash, string memory _fileType) public
```

**Purpose:** Allows a patient to add a new medical record to their personal record array.

**Parameters:**
- `_ipfsHash`: The IPFS content identifier (CID) where the encrypted file is stored
- `_fileType`: Human-readable description of the record type

**Functionality:**
- Creates a new `Record` struct with the provided IPFS hash, file type, and current timestamp
- Appends the record to the caller's (patient's) record array in `patientRecords`
- Only the patient (msg.sender) can add records to their own array

**Example Usage:**
```javascript
await contract.addRecord("QmXa3b9...", "MRI Scan - Brain", { from: patientAddress })
```

---

##### `getMyRecords() view returns (Record[] memory)`

**Signature:**
```solidity
function getMyRecords() public view returns (Record[] memory)
```

**Purpose:** Allows a patient to retrieve all of their own medical records.

**Returns:** Array of `Record` structs belonging to the caller

**Functionality:**
- Read-only function (view) that doesn't modify state
- Returns the complete record array for `msg.sender`
- Patients can only see their own records using this function

**Example Usage:**
```javascript
let myRecords = await contract.getMyRecords({ from: patientAddress })
```

![Retrieve Document](documentation/screenshots/retreive%20document.png)

---

##### `grantAccess(address _viewerAddress, uint256 _recordIndex)`

**Signature:**
```solidity
function grantAccess(address _viewerAddress, uint256 _recordIndex) public
```

**Purpose:** Allows a patient to grant a healthcare provider (viewer) access to a specific record.

**Parameters:**
- `_viewerAddress`: Ethereum address of the doctor/viewer being granted access
- `_recordIndex`: Index of the record in the patient's record array

**Functionality:**
- Validates that the caller owns a record at the specified index
- Checks that access hasn't already been granted (uses `hasAccess` mapping)
- Adds the record index to the viewer's permitted records in `accessPermissions`
- Updates `hasAccess` mapping for quick future lookups
- Implements granular permission: each record must be explicitly shared

**Example Usage:**
```javascript
await contract.grantAccess(doctorAddress, 0, { from: patientAddress }) // Grant access to first record
```

---

##### `revokeAccess(address _viewerAddress, uint256 _recordIndex)`

**Signature:**
```solidity
function revokeAccess(address _viewerAddress, uint256 _recordIndex) public
```

**Purpose:** Allows a patient to revoke a previously granted access permission.

**Parameters:**
- `_viewerAddress`: Ethereum address of the viewer whose access is being revoked
- `_recordIndex`: Index of the record to revoke access from

**Functionality:**
- Finds the specified record index in the viewer's permission array
- Removes the permission using "swap-and-pop" technique for gas efficiency:
  - Swaps the target element with the last element
  - Removes the last element (now the target)
- Updates `hasAccess` mapping to reflect removal
- Patient can revoke access at any time

**Example Usage:**
```javascript
await contract.revokeAccess(doctorAddress, 0, { from: patientAddress })
```

---

##### `getSharedRecords(address _patientAddress) view returns (Record[] memory)`

**Signature:**
```solidity
function getSharedRecords(address _patientAddress) public view returns (Record[] memory)
```

**Purpose:** Allows a viewer (doctor) to see all records that a specific patient has shared with them.

**Parameters:**
- `_patientAddress`: The patient's Ethereum address

**Returns:** Array of `Record` structs that the caller has permission to view

**Functionality:**
- Read-only function that queries the `accessPermissions` mapping
- Retrieves the list of accessible record indices for the caller from the specified patient
- Iterates through permitted indices and builds an array of full `Record` structs
- Only returns records that the patient has explicitly granted access to

**Example Usage:**
```javascript
let sharedRecords = await contract.getSharedRecords(patientAddress, { from: doctorAddress })
```

### Security Considerations

- **Access Control:** Only patients can add their own records and manage permissions
- **Data Privacy:** Actual medical files are encrypted and stored off-chain (IPFS)
- **Transparency:** All access grants and revocations are logged on-chain
- **Immutability:** Record metadata cannot be modified once added (by design)
- **Granular Permissions:** Each record must be explicitly shared; no blanket access

### Gas Optimization Techniques

- **Efficient Removal:** `revokeAccess` uses swap-and-pop instead of shifting array elements
- **Quick Lookups:** `hasAccess` mapping prevents duplicate permission checks
- **Minimal On-Chain Data:** Only metadata stored on-chain; files stored on IPFS

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Error: Network with id '...' is not configured"

**Solution:**
- Ensure Ganache is running
- Check that `truffle-config.js` has the correct network settings
- Verify the port (default is 7545)

#### Issue: "Error: Contract has not been deployed to detected network"

**Solution:**
```bash
# Reset and redeploy
truffle migrate --reset --network development
```

#### Issue: MetaMask shows "Transaction Failed"

**Solution:**
- Make sure you're connected to the Ganache network in MetaMask
- Check that you have enough ETH in your account
- Try resetting MetaMask account: Settings → Advanced → Reset Account

#### Issue: Cannot see transactions in Ganache

**Solution:**
- Verify you're using the correct RPC URL in MetaMask
- Check that Chain ID matches (1337 for Ganache)
- Restart Ganache and re-run migrations

#### Issue: "TypeError: Cannot read property 'call' of undefined"

**Solution:**
- The contract instance wasn't loaded properly
- In Truffle console, retry:
  ```javascript
  let instance = await MedicalRecordsContract.deployed()
  ```

## Future Development

### Planned Features

#### Phase 1: IPFS Integration
- Set up IPFS node or connect to Pinata/Infura IPFS gateway
- Implement client-side file encryption before upload
- Add file upload/download functionality to frontend
- Support multiple file formats (PDF, DICOM, images, etc.)

#### Phase 2: Frontend Development
- Build React-based user interface
- Integrate Web3.js for blockchain interactions
- Create patient dashboard to manage records
- Implement doctor/healthcare provider portal
- Add file preview and download capabilities

#### Phase 3: Enhanced Features
- Multi-signature access for sensitive records
- Temporary access permissions (time-limited access)
- Emergency access protocol for critical situations
- Audit log viewer for patients to track who accessed their records
- Mobile-responsive design

#### Phase 4: Production Deployment
- Deploy to Ethereum testnet (Sepolia/Goerli)
- Conduct security audit
- Optimize gas costs
- Deploy to mainnet (if applicable)

### Contributing

We welcome contributions! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code:
- Follows Solidity style guide
- Includes comprehensive comments
- Passes all existing tests
- Includes new tests for new features

## Project Resources

### Repository Map

```
cse540-blockchain-project/
├── backend/                      # Express.js server for IPFS uploads
├── frontend/                     # React frontend application
├── contracts/
│   └── MedicalRecordsContract.sol  # Core smart contract
├── migrations/
│   └── 2_deploy_medical_records.js # Deployment script
├── documentation/
│   ├── Group21_Project_Proposal.pdf # Project proposal
│   └── screenshots/                # UI and terminal screenshots
├── test/
│   └── TestMedicalRecords.js       # Test suite for the contract
├── build/
│   └── contracts/                  # Compiled contract artifacts (JSON)
├── truffle-config.js               # Truffle configuration file
└── README.md                       # This file
```

### Key Files

- **Smart Contract:** [`contracts/MedicalRecordsContract.sol`](contracts/MedicalRecordsContract.sol)
- **Deployment Script:** [`migrations/2_deploy_medical_records.js`](migrations/2_deploy_medical_records.js)
- **Project Proposal:** [`documentation/Group21_Project_Proposal.pdf`](documentation/Group21_Project_Proposal.pdf)

## License

This project is developed as part of CSE540 coursework at Arizona State University. See the `LICENSE` file for details.

---

**Project Team:** Group 21
**Course:** CSE540 - Blockchain Technology
**Institution:** Arizona State University
**Semester:** Fall 2025

For questions or issues, please open an issue on GitHub or contact the project team.