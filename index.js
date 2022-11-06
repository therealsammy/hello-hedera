console.clear();
const {
  AccountId,
  PrivateKey,
  Client,
  FileCreateTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
} = require("@hashgraph/sdk");
require("dotenv").config();

const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  // Import the compiled contract bytecode
  const contractBytecode = fs.readFileSync(
    "LookupContract_sol_LookupContract.bin"
  );

  // Create a file on Hedera and store the bytecode

  const fileCreateTx = new FileCreateTransaction()
    .setContents(contractBytecode)
    .setKeys([operatorKey])
    .setMaxTransactionFee(new Hbar(0.75))
    .freezeWith(client);

  const fileCreateSign = await fileCreateTx.sign(operatorKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  const bytecodefileId = fileCreateRx.fileId;
  console.log(` - The bytecode file ID is: ${bytecodefileId} \n`);

  // Instantiate the smart contract

  const contractInstantiateTx = new ContractCreateTransaction()
    .setByteCodeFileId(bytecodefileId)
    .setGas(100000)
    .setConstructorParamaters(
      new ContractFunctionParameters().addString("Alice").addUint256(111111)
    );

  const contractInstantiateSubmit = new contractInstantiateTx.execute(client);
  const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(
    client
  );
  const contractId = contractInstantiateRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  console.log(` - The smart contract ID is: ${contractId} \n`);
  console.log(
    `- The smart contract ID in solidity format is: ${contractAddress} \n`
  );

  // Query the contract to check changes in state variable

  const contractQueryTx = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction(
      "getMobileNumber",
      new ContractFunctionParameters().addString("Alice")
    )
    .setMaxQueryPayment(new Hbar(0.00000001));

  const contractQuerySubmit = await contractQueryTx.execute(client);
  const contractQueryResult = contractQuerySubmit.getUint256(0);
  console.log(
    ` - Here's the phone number you requested: ${contractQueryResult} \n`
  );

  // Call contract function to update the state variable

  // Query the contract to check changes in state variable
}

main();
