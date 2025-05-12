// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Game__NotOwner();
error Game__UsernameAlreadyTaken();
error Game__UserNotRegistered();
error Game__InvalidScore();
error Game__InvalidAchievement();

contract Game is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    address private immutable i_owner;
    struct Achievement {
        string name;
        string imageURI;
        uint256 requiredScore;
        uint256 maxSupply;
        uint256 currentSupply;
    }

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
    mapping(uint256 => Achievement) private s_achievements;
    uint256 private s_achievementCount;

    // Events
    event PlayerRegistered(address indexed player, string username);
    event ScoreUpdated(address indexed player, uint256 newScore);
    event NFTMinted(
        address indexed player,
        uint256 tokenId,
        string achievementName
    );
    event AchievementCreated(
        uint256 indexed achievementId,
        string name,
        uint256 requiredScore
    );

    constructor() ERC721("GameAchievement", "GAME") Ownable(msg.sender) {
        i_owner = msg.sender;
    }

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

    function createAchievement(
        string memory _name,
        string memory _imageURI,
        uint256 _requiredScore,
        uint256 _maxSupply
    ) external onlyOwner {
        uint256 achievementId = s_achievementCount++;
        s_achievements[achievementId] = Achievement({
            name: _name,
            imageURI: _imageURI,
            requiredScore: _requiredScore,
            maxSupply: _maxSupply,
            currentSupply: 0
        });

        emit AchievementCreated(achievementId, _name, _requiredScore);
    }

    function updateScore(uint256 _newScore) external onlyRegistered {
        if (_newScore <= s_players[msg.sender].highScore) {
            revert Game__InvalidScore();
        }

        s_players[msg.sender].highScore = _newScore;
        s_players[msg.sender].totalGames++;

        // Check and mint achievements based on score
        for (uint256 i = 0; i < s_achievementCount; i++) {
            Achievement storage achievement = s_achievements[i];
            if (
                _newScore >= achievement.requiredScore &&
                achievement.currentSupply < achievement.maxSupply
            ) {
                _mintAchievementNFT(i);
            }
        }

        emit ScoreUpdated(msg.sender, _newScore);
    }

    function _mintAchievementNFT(uint256 _achievementId) private {
        Achievement storage achievement = s_achievements[_achievementId];

        // Create token URI with metadata
        string memory tokenURI = string(
            abi.encodePacked(
                '{"name": "',
                achievement.name,
                '",',
                '"description": "Achievement unlocked in the game",',
                '"image": "',
                achievement.imageURI,
                '"}'
            )
        );

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        s_players[msg.sender].ownedNFTs.push(tokenId);
        achievement.currentSupply++;

        emit NFTMinted(msg.sender, tokenId, achievement.name);
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

    function getAchievementInfo(
        uint256 _achievementId
    )
        external
        view
        returns (
            string memory name,
            string memory imageURI,
            uint256 requiredScore,
            uint256 maxSupply,
            uint256 currentSupply
        )
    {
        Achievement memory achievement = s_achievements[_achievementId];
        return (
            achievement.name,
            achievement.imageURI,
            achievement.requiredScore,
            achievement.maxSupply,
            achievement.currentSupply
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

    function getOwner() external view returns (address) {
        return i_owner;
    }

    function getAllAchievements()
        external
        view
        returns (
            string[] memory names,
            string[] memory imageURIs,
            uint256[] memory requiredScores,
            uint256[] memory maxSupplies,
            uint256[] memory currentSupplies
        )
    {
        names = new string[](s_achievementCount);
        imageURIs = new string[](s_achievementCount);
        requiredScores = new uint256[](s_achievementCount);
        maxSupplies = new uint256[](s_achievementCount);
        currentSupplies = new uint256[](s_achievementCount);

        for (uint256 i = 0; i < s_achievementCount; i++) {
            Achievement memory achievement = s_achievements[i];
            names[i] = achievement.name;
            imageURIs[i] = achievement.imageURI;
            requiredScores[i] = achievement.requiredScore;
            maxSupplies[i] = achievement.maxSupply;
            currentSupplies[i] = achievement.currentSupply;
        }

        return (names, imageURIs, requiredScores, maxSupplies, currentSupplies);
    }
}
