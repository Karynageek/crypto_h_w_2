//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./OrangeToken.sol";

interface ERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool success);
}

contract Staking is AccessControl {
    OrangeToken public orangeToken;
    address public ortWethPair;

    constructor(OrangeToken _orangeToken, address _ortWethPair) {
        orangeToken = _orangeToken;
        ortWethPair = _ortWethPair;

        _grantRole("ADMIN_ROLE", msg.sender);
    }

    mapping(address => Deposit) private userInfo;

    struct Deposit {
        uint256 amount;
        uint256 startDate;
    }

    event Stake(address indexed user, uint256 amount, uint256 startDate);

    function stake(uint256 amount) external {
        Deposit storage deposit = userInfo[msg.sender];

        if (deposit.amount != 0) {
            claim();
        }

        deposit.amount = amount;
        deposit.startDate = block.timestamp;

        ERC20(ortWethPair).transferFrom(msg.sender, address(this), amount);

        emit Stake(msg.sender, amount, deposit.startDate);
    }

    function claim() public {
        Deposit storage deposit = userInfo[msg.sender];
        require(deposit.amount != 0, "No reward");

        uint256 passedPeriod = (block.timestamp - deposit.startDate) /
            60 /
            60 /
            24;

        uint256 payoutAmount = (passedPeriod * 20) / 100 / 365;

        deposit.startDate = block.timestamp;

        orangeToken.mint(msg.sender, payoutAmount);
    }

    function withdraw(uint256 amount) external {
        claim();

        ERC20(ortWethPair).transferFrom(address(this), msg.sender, amount);

        delete userInfo[msg.sender];
    }

    function getUserInfo(address user)
        external
        view
        returns (
            uint256 _amount,
            uint256 _payoutAmount,
            uint256 _startDate
        )
    {
        Deposit memory deposit = userInfo[user];
        uint256 passedPeriod = (block.timestamp - deposit.startDate) /
            60 /
            60 /
            24;

        uint256 payoutAmount = (passedPeriod * 20) / 100 / 365;

        return (deposit.amount, payoutAmount, deposit.startDate);
    }
}
