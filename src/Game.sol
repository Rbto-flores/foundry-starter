// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

error Game__NotOwner();
error Game__UsernameAlreadyTaken();
error Game__UserNotRegistered();
error Game__InvalidScore();

contract Game is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Player {
        string username;
        uint256 highScore;
        uint256 totalGames;
        uint256[] ownedNFTs;
    }

    // State variables
    mapping(address => Player) private s_players;
    mapping(string => bool) private s_usernames;
    address[] private s_registeredPlayers;

    // Events
    event PlayerRegistered(address indexed player, string username);
    event ScoreUpdated(address indexed player, uint256 newScore);
    event NFTMinted(address indexed player, uint256 tokenId);

    constructor() ERC721("GameAchievement", "GAME") Ownable(msg.sender) {}

    // Modifiers
    modifier onlyRegistered() {
        if (bytes(s_players[msg.sender].username).length == 0) {
            revert Game__UserNotRegistered();
        }
        _;
    }

    // Functions
    function registerPlayer(string memory _username) external {
        if (s_usernames[_username]) {
            revert Game__UsernameAlreadyTaken();
        }
        if (bytes(s_players[msg.sender].username).length > 0) {
            revert Game__UserNotRegistered();
        }

        s_players[msg.sender] = Player({
            username: _username,
            highScore: 0,
            totalGames: 0,
            ownedNFTs: new uint256[](0)
        });
        s_usernames[_username] = true;
        s_registeredPlayers.push(msg.sender);

        emit PlayerRegistered(msg.sender, _username);
    }

    function updateScore(uint256 _newScore) external onlyRegistered {
        if (_newScore <= s_players[msg.sender].highScore) {
            revert Game__InvalidScore();
        }

        s_players[msg.sender].highScore = _newScore;
        s_players[msg.sender].totalGames++;

        // Mint NFT if score is high enough (e.g., above 1000)
        if (_newScore >= 1000) {
            _mintAchievementNFT();
        }

        emit ScoreUpdated(msg.sender, _newScore);
    }

    function _mintAchievementNFT() private {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        s_players[msg.sender].ownedNFTs.push(newTokenId);

        emit NFTMinted(msg.sender, newTokenId);
    }

    // View functions
    function getPlayerInfo(
        address _player
    )
        external
        view
        returns (
            string memory username,
            uint256 highScore,
            uint256 totalGames,
            uint256[] memory ownedNFTs
        )
    {
        Player memory player = s_players[_player];
        return (
            player.username,
            player.highScore,
            player.totalGames,
            player.ownedNFTs
        );
    }

    function getRegisteredPlayersCount() external view returns (uint256) {
        return s_registeredPlayers.length;
    }

    function isUsernameTaken(
        string memory _username
    ) external view returns (bool) {
        return s_usernames[_username];
    }
}
