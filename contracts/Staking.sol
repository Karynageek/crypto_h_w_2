//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./OrangeToken.sol";

contract Staking {
    OrangeToken public orangeToken;
    IERC20 public ortWethPair;

    uint256 public constant ANNUAL_PERCENT = 20;

    constructor(OrangeToken _orangeToken, IERC20 _ortWethPair) {
        orangeToken = _orangeToken;
        ortWethPair = _ortWethPair;
    }

    mapping(address => Deposit) private userInfo;

    struct Deposit {
        uint256 amount;
        uint256 startDate;
    }

    event Stake(address indexed user, uint256 amount, uint256 startDate);

    function stake(uint256 amount) external {
        Deposit storage deposit = userInfo[msg.sender];

        if (deposit.amount > 0) {
            claim();
        }

        deposit.amount = amount;
        deposit.startDate = block.timestamp;

        ortWethPair.transferFrom(msg.sender, address(this), amount);

        emit Stake(msg.sender, amount, deposit.startDate);
    }

    function claim() public {
        Deposit storage deposit = userInfo[msg.sender];

        uint256 payoutAmount = getPayoutAmount(
            deposit.amount,
            deposit.startDate
        );

        if (payoutAmount > 0) {
            deposit.startDate = block.timestamp;
            orangeToken.mint(msg.sender, payoutAmount);
        }
    }

    function getPayoutAmount(uint256 _amount, uint256 _startDate)
        internal
        view
        returns (uint256 payoutAmount)
    {
        return
            ((block.timestamp - _startDate) * _amount * ANNUAL_PERCENT) /
            3153600000;
    }

    function withdraw(uint256 _amount) external {
        Deposit storage deposit = userInfo[msg.sender];

        require(deposit.amount >= _amount, "Amount exceeds staking");

        if (deposit.amount > 0) {
            claim();
        }

        deposit.amount -= _amount;

        ortWethPair.transfer(msg.sender, _amount);
    }

    function getUserInfo(address user)
        external
        view
        returns (
            uint256 totalAmount,
            uint256 amountToPay,
            uint256 startDate
        )
    {
        Deposit memory deposit = userInfo[user];
        uint256 payoutAmount = getPayoutAmount(
            deposit.amount,
            deposit.startDate
        );

        return (deposit.amount, payoutAmount, deposit.startDate);
    }
}
