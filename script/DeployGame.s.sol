// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";

import {Game} from "../src/Game.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployGame is Script {
    Game game;

    function run() external returns (Game) {
        // Before startBroadcast -> not a real tx
        //HelperConfig helperConfig = new HelperConfig();
        //address ethUsdPriceFeed = helperConfig.activeNetworkConfig();
        // After startBroadcast -> real tx
        vm.startBroadcast();
        game = new Game();
        vm.stopBroadcast();
        return game;
    }
}
