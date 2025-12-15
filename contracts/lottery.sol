// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// UPDATED IMPORTS FOR CHAINLINK VRF 2.5
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract LotteryVRF is VRFConsumerBaseV2Plus {
    // Chainlink VRF Variables
    uint256 private immutable i_subscriptionId; // Updated to uint256 for V2.5
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    uint256 public i_ticketPrice;
    address[] public players;
    address public lastWinner;
    bool public s_lotteryState; 

    // Events
    event TicketBought(address indexed player);
    event WinnerPicked(address indexed winner, uint256 amountWon);
    event RequestSent(uint256 requestId, uint32 numWords);

    constructor(
        address vrfCoordinatorV2_5, // New V2.5 Coordinator
        bytes32 gasLane,
        uint256 subscriptionId, // Updated type to hold your large ID
        uint256 ticketPrice
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2_5) {
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_ticketPrice = ticketPrice;
        i_callbackGasLimit = 100000;
        s_lotteryState = true; 
    }

    function buyTicket() external payable {
        require(s_lotteryState == true, "Lottery is currently calculating winner");
        require(msg.value == i_ticketPrice, "Incorrect ticket price");
        players.push(msg.sender);
        emit TicketBought(msg.sender);
    }

    function pickWinner() external onlyOwner {
        require(players.length > 0, "No players in lottery");
        require(s_lotteryState == true, "Already calculating");
        
        s_lotteryState = false; 

        // UPDATED: Request format for V2.5
        VRFV2PlusClient.RandomWordsRequest memory request = VRFV2PlusClient.RandomWordsRequest({
            keyHash: i_gasLane,
            subId: i_subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: i_callbackGasLimit,
            numWords: NUM_WORDS,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false}) // Payment in LINK
            )
        });

        uint256 requestId = s_vrfCoordinator.requestRandomWords(request);
        emit RequestSent(requestId, NUM_WORDS);
    }

    function fulfillRandomWords(uint256, /* requestId */ uint256[] calldata randomWords) internal override {
        uint256 winnerIndex = randomWords[0] % players.length;
        address payable winner = payable(players[winnerIndex]);
        uint256 amountWon = address(this).balance;
        
        lastWinner = winner;
        delete players;
        s_lotteryState = true; 

        emit WinnerPicked(winner, amountWon);

        (bool success, ) = winner.call{value: amountWon}("");
        require(success, "Transfer failed");
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }
}