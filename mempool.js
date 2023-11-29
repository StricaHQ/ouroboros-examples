/* eslint-disable import/first */
/* eslint-disable import/order */

const { OuroborosClient } = require("@stricahq/ouroboros-network-js");
const cbors = require("@stricahq/cbors");
const BabbageParser = require("@stricahq/cardano-codec").babbage;

const client = new OuroborosClient({
  protocolId: 32781,
  protocolMagic: 764824073,
});

// connect to cardano node
// client.connect();

function acquireSnapshot() {
  client.LocalTxMonitor.acquireSnapshot();
}

function requestNextTx() {
  client.LocalTxMonitor.requestNextTx();
}

client.on("connect", () => {
  acquireSnapshot();
});

client.on("disconnect", () => {
  console.log("socket disconnected");
  process.exit();
});

async function onData(data) {
  if (data.acquired) {
    requestNextTx();
  }
  if (data.await) {
    console.log("Snapshot awaiting");
  }
  if (data.nextTx) {
    try {
      const decodedTx = cbors.Decoder.decode(data.nextTx).value;
      const txBody = decodedTx[0];
      const transaction = BabbageParser.parseTransaction(txBody, data.nextTx);

      console.log(transaction.hash);

      console.log(transaction);
    } catch (error) {
      console.log(error);
    }
    requestNextTx();
  }
  if (data.nextTx == null) {
    console.log("Requesting next snapshot");
    acquireSnapshot();
  }
}

client.LocalTxMonitor.on("data", onData);
