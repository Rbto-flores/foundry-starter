// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import {PriceConverter} from "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//Get funds from users

//Withdras fund

//Set a minium amount to fund

// contant an inmutable could make more gas efficient a contract

error FundMe__NotOwner();

contract FundMe {
    //Here we attach all uint256 to PriceConverter library so all uint256 can have access to getConversionRate function
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;

    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeed) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    mapping(address funder => uint256 amountFunded)
        private s_addressToAmountFunded;

    //allow users to send funds
    function fund() public payable {
        // have a minimum $ to be sent
        //Since msg.value is a uint256 it can have access to getConversionRate funtion
        //if getConversionRate has a second parameter, it is sent inside the parentheses but the first one sent will remain msg.value
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "didn't send enough ETH"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    function withDraw() public onlyOwner {
        //This way is more cheaper than reading the s_funders length over a loop
        uint256 fundersLength = s_funders.length;
        for (
            uint256 funderIndex = 0;
            funderIndex < fundersLength;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        // //transfer
        // //payable(msg.senders) equals to typecast the address to a payable address
        // payable (msg.sender).transfer(address(this).balance);
        // //send
        // bool sendSucess = payable (msg.sender).send(address(this).balance);
        // require(sendSucess);

        // //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess);
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        // require(msg.sender == i_owner, "Sender is not the owner!");
        _;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // View / Pure functions (Getters)

    function getAddresToAmoutFunded(
        address fundingAddress
    ) external view returns (uint256) {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getFunder(uint256 index) external view returns (address) {
        return s_funders[index];
    }

    function getOwner() external view returns (address) {
        return i_owner;
    }
}
