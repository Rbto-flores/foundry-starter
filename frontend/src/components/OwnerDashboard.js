import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import GameABI from '../GameABI.json';

const GAME_CONTRACT_ADDRESS = "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F";

function OwnerDashboard() {
    const [achievements, setAchievements] = useState([]);
    const [newAchievement, setNewAchievement] = useState({
        name: '',
        imageURI: '',
        requiredScore: '',
        maxSupply: ''
    });
    const [contract, setContract] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        setupContract();
    }, []);

    const setupContract = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GameABI, signer);
        setContract(contract);

        // Check if current user is owner
        const owner = await contract.getOwner();
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());

        // Load existing achievements
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
            console.error("Error loading achievements:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAchievement(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const createAchievement = async (e) => {
        e.preventDefault();
        try {
            const tx = await contract.createAchievement(
                newAchievement.name,
                newAchievement.imageURI,
                newAchievement.requiredScore,
                newAchievement.maxSupply
            );
            await tx.wait();
            await loadAchievements(contract);
            setNewAchievement({
                name: '',
                imageURI: '',
                requiredScore: '',
                maxSupply: ''
            });
        } catch (error) {
            console.error("Error creating achievement:", error);
        }
    };

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
                <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                    <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                        <p>Only the contract owner can access this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <h1 className="text-2xl font-bold mb-8">Owner Dashboard</h1>

                        {/* Create Achievement Form */}
                        <form onSubmit={createAchievement} className="space-y-4 mb-8">
                            <h2 className="text-xl font-semibold">Create New Achievement</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newAchievement.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Image URI</label>
                                <input
                                    type="text"
                                    name="imageURI"
                                    value={newAchievement.imageURI}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Required Score</label>
                                <input
                                    type="number"
                                    name="requiredScore"
                                    value={newAchievement.requiredScore}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Max Supply</label>
                                <input
                                    type="number"
                                    name="maxSupply"
                                    value={newAchievement.maxSupply}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Create Achievement
                            </button>
                        </form>

                        {/* Existing Achievements List */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Existing Achievements</h2>
                            <div className="space-y-4">
                                {achievements.map((achievement) => (
                                    <div key={achievement.id} className="border rounded-lg p-4">
                                        <h3 className="font-semibold">{achievement.name}</h3>
                                        <img src={achievement.imageURI} alt={achievement.name} className="w-32 h-32 object-cover my-2" />
                                        <p>Required Score: {achievement.requiredScore}</p>
                                        <p>Supply: {achievement.currentSupply}/{achievement.maxSupply}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OwnerDashboard; 