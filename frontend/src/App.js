import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GameABI from './GameABI.json';
import OwnerDashboard from './components/OwnerDashboard';

const GAME_CONTRACT_ADDRESS = "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F";

function App() {
    const [account, setAccount] = useState(null);
    const [gameContract, setGameContract] = useState(null);
    const [username, setUsername] = useState('');
    const [score, setScore] = useState(0);
    const [playerInfo, setPlayerInfo] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                console.log("Make sure you have MetaMask!");
                return;
            }

            const accounts = await ethereum.request({ method: "eth_accounts" });
            if (accounts.length !== 0) {
                const account = accounts[0];
                setAccount(account);
                setupContract(account);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);
            setupContract(accounts[0]);
        } catch (error) {
            console.log(error);
        }
    };

    const setupContract = async (account) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GameABI, signer);
        setGameContract(contract);
        await checkRegistration(contract, account);
        await loadAchievements(contract);
    };

    const loadAchievements = async (contract) => {
        try {
            const [
                names,
                imageURIs,
                requiredScores,
                maxSupplies,
                currentSupplies
            ] = await contract.getAllAchievements();

            const achievements = names.map((name, index) => ({
                id: index,
                name: name,
                imageURI: imageURIs[index],
                requiredScore: requiredScores[index].toString(),
                maxSupply: maxSupplies[index].toString(),
                currentSupply: currentSupplies[index].toString()
            }));

            console.log("Achievements:", achievements);
            setAchievements(achievements);
        } catch (error) {
            console.log("Error loading achievements:", error);
        }
    };

    const checkRegistration = async (contract, account) => {
        try {
            const info = await contract.getPlayerInfo(account);
            if (info.username !== '') {
                setIsRegistered(true);
                setPlayerInfo({
                    username: info.username,
                    highScore: info.highScore.toString(),
                    totalGames: info.totalGames.toString(),
                    ownedNFTs: info.ownedNFTs.map(nft => nft.toString())
                });
            }
        } catch (error) {
            console.log(error);
        }
    };

    const registerPlayer = async () => {
        try {
            if (!username) return;
            const tx = await gameContract.registerPlayer(username);
            await tx.wait();
            setIsRegistered(true);
            await checkRegistration(gameContract, account);
        } catch (error) {
            console.log(error);
        }
    };

    const updateScore = async () => {
        try {
            const tx = await gameContract.updateScore(score);
            await tx.wait();
            await checkRegistration(gameContract, account);
        } catch (error) {
            console.log(error);
        }
    };

    const PlayerDashboard = () => (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                {!account ? (
                                    <button
                                        onClick={connectWallet}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Connect Wallet
                                    </button>
                                ) : (
                                    <div>
                                        <p className="mb-4">Connected: {account}</p>
                                        {!isRegistered ? (
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    placeholder="Enter username"
                                                    className="border p-2 rounded"
                                                />
                                                <button
                                                    onClick={registerPlayer}
                                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                                >
                                                    Register
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <h2 className="text-xl font-bold">Player Info</h2>
                                                    <p>Username: {playerInfo?.username}</p>
                                                    <p>High Score: {playerInfo?.highScore}</p>
                                                    <p>Total Games: {playerInfo?.totalGames}</p>
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={score}
                                                        onChange={(e) => setScore(parseInt(e.target.value))}
                                                        placeholder="Enter score"
                                                        className="border p-2 rounded"
                                                    />
                                                    <button
                                                        onClick={updateScore}
                                                        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded ml-2"
                                                    >
                                                        Update Score
                                                    </button>
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold">Your Achievements</h2>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {playerInfo?.ownedNFTs?.map((nft, index) => (
                                                            <div key={index} className="border p-2 rounded">
                                                                NFT #{nft}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold">Available Achievements</h2>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {achievements.map((achievement) => (
                                                            <div key={achievement.id} className="border p-2 rounded">
                                                                <h3 className="font-semibold">{achievement.name}</h3>
                                                                <img src={achievement.imageURI} alt={achievement.name} className="w-32 h-32 object-cover my-2" />
                                                                <p>Required Score: {achievement.requiredScore}</p>
                                                                <p>Progress: {playerInfo?.highScore || 0}/{achievement.requiredScore}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Router>
            <div>
                <nav className="bg-gray-800 p-4">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <Link to="/" className="text-white font-bold">Game</Link>
                        <Link to="/owner" className="text-white">Owner Dashboard</Link>
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={<PlayerDashboard />} />
                    <Route path="/owner" element={<OwnerDashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App; 