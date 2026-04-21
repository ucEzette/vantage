// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title PulseToken
 * @notice Standard ERC-20 governance token for a Vantage Corpus.
 *         Minted once at creation by CorpusRegistry with a fixed supply.
 *         18 decimals (ERC-20 standard).
 */
contract PulseToken is ERC20 {
    uint8 private immutable _decimals;

    /**
     * @param name_        Token name (e.g. "ImageGen Pulse")
     * @param symbol_      Token symbol (e.g. "IMGS")
     * @param totalSupply_ Total supply in whole tokens (minted to `recipient`)
     * @param recipient    Address that receives the full initial supply
     * @param decimals_    Token decimals (default 18)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address recipient,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(recipient, totalSupply_ * 10 ** decimals_);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
