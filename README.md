# TOKEN DEPLOYED ON RINKEBY TESTNET

**OrangeToken:**<br/> 
<a href="https://rinkeby.etherscan.io/address/0x894C8c9B0c0040d3Fb71D207dD91DDdea59F71FC#code">https://rinkeby.etherscan.io/address/0x894C8c9B0c0040d3Fb71D207dD91DDdea59F71FC#code</a>

**WrappedETH:**<br/> 
<a href="https://rinkeby.etherscan.io/address/0xb6bCee07f1dC0359c97e882fA31D5b7642CbF8a3#code">https://rinkeby.etherscan.io/address/0xb6bCee07f1dC0359c97e882fA31D5b7642CbF8a3#code</a>

**Pair:**<br/> 
<a href="https://rinkeby.etherscan.io/address/0xDfd1D4acB55946A62cf364CfCa73F0913d02e5CC#code">https://rinkeby.etherscan.io/address/0xDfd1D4acB55946A62cf364CfCa73F0913d02e5CC#code</a>

**Staking:**<br/> 
<a href="https://rinkeby.etherscan.io/address/0x5A3ebe7026F04c528f57194E096Ea2038E16Bf07#code">https://rinkeby.etherscan.io/address/0x5A3ebe7026F04c528f57194E096Ea2038E16Bf07#code</a>

# PROJECT DEPLOYMENT FLOW

1. Clone the project from GitHub
2. Install dependencies
3. Customize configurations
4. Deploy

# 1. Clone the project from GitHub

Enter the following command in the terminal:

```shell
git clone https://github.com/Karynageek/crypto_h_w_2.git
```

# 2. Install dependencies

Before launch next command open the terminal into the the main folder of project
Then, enter:

```shell
npm install
```

# 3. Customize configurations

In this project:

1. rename the .env.example file to a file named .env
2. in the .env file change:

a) To get the Etherscan API key, go to
<a href="https://etherscan.io/myapikey">https://etherscan.io/myapikey</a>

c) your mnemonic of the account which will send the deployment transaction

# 4. Deploy

# DEPLOY ON RINKEBY TESTNET

```shell
npx hardhat run scripts/deploy_orange.ts --network rinkeby
npx hardhat run scripts/deploy_weth.ts --network rinkeby
npx hardhat run scripts/deploy_staking.ts --network rinkeby
```

# VERIFICATION

Verification is automated
