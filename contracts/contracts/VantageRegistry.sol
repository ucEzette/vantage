// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PulseToken.sol";

/**
 * @title VantageRegistry
 * @notice On-chain registry for Vantage Protocol on Arc Network.
 *         Each Vantage is an AI agent corporation with Patron (governance),
 *         Kernel (policies), and Pulse (ERC-20 token) configs.
 *
 *         On creation, the contract deploys a new PulseToken (ERC-20),
 *         sends 3% as a launchpad fee to the protocol wallet, and
 *         transfers the remaining 97% to the Creator.
 */
contract VantageRegistry {
    // ── Constants ────────────────────────────────────────────────────
    uint16 public constant LAUNCHPAD_FEE_BPS = 300; // 3.00%

    // ── Structs ─────────────────────────────────────────────────────
    struct PatronConfig {
        uint16 creatorShare;   // basis points (6000 = 60.00%)
        uint16 investorShare;
        uint16 treasuryShare;
        address creatorAddr;
        address investorAddr;
        address treasuryAddr;
    }

    struct KernelConfig {
        uint256 approvalThreshold; // USD cents (1000 = $10.00)
        uint256 gtmBudget;         // USD cents per month
        uint256 minPatronPulse;    // minimum Pulse to become Patron
    }

    struct PulseConfig {
        address tokenAddr;       // ERC-20 token address (filled by contract on creation)
        uint256 totalSupply;     // total supply in whole tokens
        uint256 priceUsdCents;   // USD cents per Pulse
    }

    struct Vantage {
        uint256 id;
        string name;
        string category;
        address creator;       // immutable after creation
        PatronConfig patron;
        KernelConfig kernel;
        PulseConfig pulse;
        uint256 createdAt;
        bool active;
    }

    // ── State ────────────────────────────────────────────────────────
    address public immutable vantageProtocolWallet;
    mapping(uint256 => Vantage) private _vantagees;
    uint256 public nextVantageId = 1; // start from 1, 0 = nonexistent

    // ── Events ───────────────────────────────────────────────────────
    event VantageCreated(
        uint256 indexed vantageId,
        address indexed creator,
        string name
    );
    event PulseTokenCreated(
        uint256 indexed vantageId,
        address tokenAddress,
        uint256 totalSupply,
        uint256 protocolFee
    );
    event PatronUpdated(uint256 indexed vantageId);
    event KernelUpdated(uint256 indexed vantageId);
    event PulseUpdated(uint256 indexed vantageId);
    event VantageDeactivated(uint256 indexed vantageId);

    // ── Errors ───────────────────────────────────────────────────────
    error NotCreator();
    error VantageNotFound();
    error VantageInactive();
    error InvalidShares();
    error InvalidAddress();
    error EmptyName();
    error EmptyTokenName();

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _vantageProtocolWallet) {
        vantageProtocolWallet = _vantageProtocolWallet;
    }

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyCreator(uint256 vantageId) {
        if (_vantagees[vantageId].creator == address(0)) revert VantageNotFound();
        if (_vantagees[vantageId].creator != msg.sender) revert NotCreator();
        _;
    }

    modifier vantageActive(uint256 vantageId) {
        if (!_vantagees[vantageId].active) revert VantageInactive();
        _;
    }

    // ── Write Functions ──────────────────────────────────────────────

    /**
     * @notice Register a new Vantage (Genesis).
     *         Deploys an ERC-20 PulseToken, sends 3% launchpad fee to the
     *         protocol wallet, and transfers 97% to the Creator.
     * @param tokenName  Name for the Pulse token (e.g. "ImageGen Pulse")
     * @param tokenSymbol Symbol for the Pulse token (e.g. "IMGS")
     * @return vantageId The on-chain ID of the newly created Vantage.
     */
    function createVantage(
        string calldata name,
        string calldata category,
        PatronConfig calldata patron,
        KernelConfig calldata kernel,
        PulseConfig calldata pulse,
        string calldata tokenName,
        string calldata tokenSymbol
    ) external returns (uint256 vantageId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(tokenName).length == 0) revert EmptyTokenName();
        _validateShares(patron);
        _validateAddresses(patron);

        vantageId = nextVantageId++;

        // 1. Deploy ERC-20 PulseToken (minted to this contract)
        PulseToken token = new PulseToken(
            tokenName,
            tokenSymbol,
            pulse.totalSupply,
            address(this),
            18 // standard ERC-20 decimals
        );
        address tokenAddr = address(token);

        // 2. Distribute tokens: 3% protocol fee, 97% to creator
        uint256 totalMinted = pulse.totalSupply * 1e18;
        uint256 fee = (totalMinted * LAUNCHPAD_FEE_BPS) / 10000;
        uint256 creatorAmount = totalMinted - fee;

        token.transfer(vantageProtocolWallet, fee);
        token.transfer(patron.creatorAddr, creatorAmount);

        // 3. Store vantage
        Vantage storage c = _vantagees[vantageId];
        c.id = vantageId;
        c.name = name;
        c.category = category;
        c.creator = msg.sender;
        c.patron = patron;
        c.kernel = kernel;
        c.pulse = pulse;
        c.pulse.tokenAddr = tokenAddr;
        c.createdAt = block.timestamp;
        c.active = true;

        emit VantageCreated(vantageId, msg.sender, name);
        emit PulseTokenCreated(vantageId, tokenAddr, pulse.totalSupply, fee);
    }

    /**
     * @notice Update Patron (governance structure). Creator only.
     */
    function updatePatron(
        uint256 vantageId,
        PatronConfig calldata patron
    ) external onlyCreator(vantageId) vantageActive(vantageId) {
        _validateShares(patron);
        _validateAddresses(patron);
        _vantagees[vantageId].patron = patron;
        emit PatronUpdated(vantageId);
    }

    /**
     * @notice Update Kernel (governance policies). Creator only.
     */
    function updateKernel(
        uint256 vantageId,
        KernelConfig calldata kernel
    ) external onlyCreator(vantageId) vantageActive(vantageId) {
        _vantagees[vantageId].kernel = kernel;
        emit KernelUpdated(vantageId);
    }

    /**
     * @notice Update Pulse (token config — price only; token address is immutable).
     *         Creator only.
     */
    function updatePulse(
        uint256 vantageId,
        PulseConfig calldata pulse
    ) external onlyCreator(vantageId) vantageActive(vantageId) {
        _vantagees[vantageId].pulse = pulse;
        emit PulseUpdated(vantageId);
    }

    /**
     * @notice Deactivate a Vantage. Creator only. Irreversible.
     */
    function deactivateVantage(
        uint256 vantageId
    ) external onlyCreator(vantageId) vantageActive(vantageId) {
        _vantagees[vantageId].active = false;
        emit VantageDeactivated(vantageId);
    }

    // ── Read Functions ───────────────────────────────────────────────

    function getVantage(uint256 vantageId) external view returns (Vantage memory) {
        if (_vantagees[vantageId].creator == address(0)) revert VantageNotFound();
        return _vantagees[vantageId];
    }

    function isActive(uint256 vantageId) external view returns (bool) {
        return _vantagees[vantageId].active;
    }

    function creatorOf(uint256 vantageId) external view returns (address) {
        return _vantagees[vantageId].creator;
    }

    // ── Internal ─────────────────────────────────────────────────────

    function _validateShares(PatronConfig calldata p) internal pure {
        if (
            uint256(p.creatorShare) +
                uint256(p.investorShare) +
                uint256(p.treasuryShare) !=
            10000
        ) revert InvalidShares();
    }

    function _validateAddresses(PatronConfig calldata p) internal pure {
        if (
            p.creatorAddr == address(0) ||
            p.investorAddr == address(0) ||
            p.treasuryAddr == address(0)
        ) revert InvalidAddress();
        if (
            p.creatorAddr == p.investorAddr ||
            p.creatorAddr == p.treasuryAddr ||
            p.investorAddr == p.treasuryAddr
        ) revert InvalidAddress();
    }
}
