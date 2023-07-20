// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract EventLogger {
    event Log(string message);

    function log(string memory message) public {
        emit Log(message);
    }
}
