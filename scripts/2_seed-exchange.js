const { ethers } = require("hardhat");
const config = require('../src/config.json');

const tokens = number => {
    return ethers.utils.parseEther(number.toString(), 'ether');
}

const wait = seconds => {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function main() {
    const accounts = await ethers.getSigners();

    const { chainId } = await ethers.provider.getNetwork();
    console.log("Using chainId:", chainId);

    const DApp = await ethers.getContractAt('Token', config[chainId].DApp.address);
    console.log(`Tokens fetched: ${DApp.address}`);

    const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address);
    console.log(`Tokens fetched: ${mETH.address}`);

    const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address);
    console.log(`Tokens fetched: ${mDAI.address}`);

    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address);
    console.log(`Exchange fetched: ${exchange.address}\n`);

    const sender = accounts[0];
    const receiver = accounts[1];
    let amount = tokens(10000);

    let transaction, result;

    transaction = await mETH.connect(sender).transfer(receiver.address, amount);
    result = await transaction.wait();
    console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`);

    const user1 = accounts[0];
    const user2 = accounts[1];

    transaction = await DApp.connect(user1).approve(exchange.address, amount);
    await transaction.wait();
    console.log(`Approved ${amount} DApp from ${user1.address}`);

    transaction = await exchange.connect(user1).depositToken(DApp.address, amount);
    await transaction.wait();
    console.log(`Deposited ${amount} DApp from ${user1.address}`);

    transaction = await mETH.connect(user2).approve(exchange.address, amount);
    await transaction.wait();
    console.log(`Approved ${amount} mETH from ${user2.address}`);

    transaction = await exchange.connect(user2).depositToken(mETH.address, amount);
    await transaction.wait();
    console.log(`Deposited ${amount} mETH from ${user2.address}`);

    let orderId
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(5));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user1).cancelOrder(orderId);
    result = transaction.wait();
    console.log(`Cancelled order from ${user1.address}\n`);

    await wait(1);

    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(10));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderId);
    result = transaction.wait();
    console.log(`Filled order from ${user2.address}\n`);

    await wait(1);

    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), DApp.address, tokens(15));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderId);
    result = transaction.wait();
    console.log(`Filled order from ${user1.address}\n`);

    await wait(1);

    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), DApp.address, tokens(20));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderId);
    result = transaction.wait();
    console.log(`Filled order from ${user1.address}\n`);

    await wait(1);

    for (let i = 0; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), DApp.address, tokens(10));
        result = await transaction.wait();

        console.log(`Made order from ${user1.address}`);

        await wait(1);
    }

    for (let i = 0; i <= 10; i++) {
        transaction = await exchange.connect(user2).makeOrder(DApp.address, tokens(10), mETH.address, tokens(10 * i));
        result = await transaction.wait();

        console.log(`Made order from ${user2.address}`);

        await wait(1);
    }


}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
