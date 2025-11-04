// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalRecords (Improved)
 * @author Group 21
 * @notice This contract manages decentralized medical records for patients.
 * This version adds checks to prevent duplicate access grants.
 */
contract MedicalRecordsContract {

    // --- State Variables ---

    struct Record {
        string ipfsHash;
        string fileType;
        uint256 timestamp;
    }

    mapping(address => Record[]) private patientRecords;

    /**
     * @notice Stores the list of record indices a viewer can access.
     * Format: viewerAddress => patientAddress => recordIndex[]
     */
    mapping(address => mapping(address => uint256[])) private accessPermissions;

    /**
     * @notice NEW: A lookup mapping to quickly check if access is already granted.
     * This prevents duplicate entries in the accessPermissions array.
     * Format: viewerAddress => patientAddress => recordIndex => bool (true if access granted)
     */
    mapping(address => mapping(address => mapping(uint256 => bool))) private hasAccess;


    // --- Events ---

    event RecordAdded(
        address indexed patient,
        uint256 recordIndex,
        string ipfsHash
    );

    event AccessGranted(
        address indexed patient,
        address indexed viewer,
        uint256 recordIndex
    );

    event AccessRevoked(
        address indexed patient,
        address indexed viewer,
        uint256 recordIndex
    );

    // --- Functions ---

    /**
     * @notice Adds a new medical record to the calling patient's file list.
     */
    function addRecord(string memory _ipfsHash, string memory _fileType) public {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            fileType: _fileType,
            timestamp: block.timestamp
        });

        patientRecords[msg.sender].push(newRecord);

        emit RecordAdded(
            msg.sender,
            patientRecords[msg.sender].length - 1,
            _ipfsHash
        );
    }

    /**
     * @notice Fetches all records owned by the calling patient (msg.sender).
     */
    function getMyRecords() public view returns (Record[] memory) {
        return patientRecords[msg.sender];
    }

    /**
     * @notice Fetches a single record by index for the calling patient.
     */
    function getMyRecordByIndex(uint256 _recordIndex) public view returns (Record memory) {
        require(
            _recordIndex < patientRecords[msg.sender].length,
            "Record index out of bounds"
        );
        return patientRecords[msg.sender][_recordIndex];
    }

    /**
     * @notice Grants another address (viewer) access to one of the patient's records.
     */
    function grantAccess(address _viewerAddress, uint256 _recordIndex) public {
        // Check that the patient owns this record
        require(
            _recordIndex < patientRecords[msg.sender].length,
            "Record index out of bounds"
        );
        // Check that the patient is not sharing with themselves
        require(_viewerAddress != msg.sender, "Cannot grant access to self");
        // NEW: Check that viewer address is not the zero address
        require(_viewerAddress != address(0), "Cannot grant access to zero address");
        // NEW: Check if access has already been granted
        require(
            !hasAccess[_viewerAddress][msg.sender][_recordIndex],
            "Access already granted"
        );

        // Add the record index to the viewer's list for this patient
        accessPermissions[_viewerAddress][msg.sender].push(_recordIndex);
        // Set the lookup mapping to true
        hasAccess[_viewerAddress][msg.sender][_recordIndex] = true;

        emit AccessGranted(msg.sender, _viewerAddress, _recordIndex);
    }

    /**
     * @notice Revokes access to a record from a viewer.
     * @dev This is still not fully gas-efficient for large lists, but it's now correct.
     */
    function revokeAccess(address _viewerAddress, uint256 _recordIndex) public {
        // NEW: Check that access was granted in the first place
        require(
            hasAccess[_viewerAddress][msg.sender][_recordIndex],
            "Access not found or already revoked"
        );

        uint256[] storage grantedIndices = accessPermissions[_viewerAddress][msg.sender];
        bool found = false;

        // Find and remove the index from the access list (swap-and-pop)
        for (uint256 i = 0; i < grantedIndices.length; i++) {
            if (grantedIndices[i] == _recordIndex) {
                grantedIndices[i] = grantedIndices[grantedIndices.length - 1];
                grantedIndices.pop();
                found = true;
                break;
            }
        }

        // This should always be true if our hasAccess mapping was correct, but we check just in case.
        require(found, "Failed to find record in access array"); 

        // Set the lookup mapping to false
        hasAccess[_viewerAddress][msg.sender][_recordIndex] = false;

        emit AccessRevoked(msg.sender, _viewerAddress, _recordIndex);
    }

    /**
     * @notice Fetches all records that a specific patient has shared with the caller.
     */
    function getSharedRecords(address _patientAddress) public view returns (Record[] memory) {
        uint256[] memory sharedIndices = accessPermissions[msg.sender][_patientAddress];
        Record[] memory records = new Record[](sharedIndices.length);

        for (uint256 i = 0; i < sharedIndices.length; i++) {
            uint256 recordIndex = sharedIndices[i];
            if (recordIndex < patientRecords[_patientAddress].length) {
                records[i] = patientRecords[_patientAddress][recordIndex];
            }
        }

        return records;
    }
}
