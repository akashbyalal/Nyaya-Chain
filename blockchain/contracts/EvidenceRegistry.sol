// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EvidenceRegistry {

    // Represents one evidence record stored on-chain
    struct Evidence {
        string firNumber;
        string fileHash;
        uint256 timestamp;
        address uploadedBy;
        bool exists;
    }

    // Maps a SHA-256 hash to its evidence record
    mapping(string => Evidence) private evidenceRecords;

    // Event emitted whenever evidence is registered
    event EvidenceRegistered(
        string indexed fileHash,
        string firNumber,
        address indexed uploadedBy,
        uint256 timestamp
    );

    /**
     * Register a new evidence hash on the blockchain.
     */
    function registerEvidence(
        string memory fileHash,
        string memory firNumber
    ) public {

        require(bytes(fileHash).length > 0, "File hash cannot be empty");
        require(bytes(firNumber).length > 0, "FIR number cannot be empty");
        require(
            !evidenceRecords[fileHash].exists,
            "Evidence already registered"
        );

        evidenceRecords[fileHash] = Evidence({
            firNumber: firNumber,
            fileHash: fileHash,
            timestamp: block.timestamp,
            uploadedBy: msg.sender,
            exists: true
        });

        emit EvidenceRegistered(
            fileHash,
            firNumber,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * Returns true if this evidence hash exists.
     */
    function verifyEvidence(
        string memory fileHash
    ) public view returns (bool) {

        return evidenceRecords[fileHash].exists;
    }

    /**
     * Returns complete evidence information.
     */
    function getEvidence(
        string memory fileHash
    )
        public
        view
        returns (
            string memory firNumber,
            uint256 timestamp,
            address uploadedBy
        )
    {

        require(
            evidenceRecords[fileHash].exists,
            "Evidence not found"
        );

        Evidence memory record = evidenceRecords[fileHash];

        return (
            record.firNumber,
            record.timestamp,
            record.uploadedBy
        );
    }
}