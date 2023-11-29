const util = require("util");
const { OuroborosClient } = require("@stricahq/ouroboros-network-js");
const cbors = require("@stricahq/cbors");
const BabbageParser = require("@stricahq/cardano-codec").babbage;

const client = new OuroborosClient({
  protocolId: 32781,
  protocolMagic: 1,
});


// connect to Cardano node
// client.connect(socketPath);

function initiate() {
  const lastBlocks = [
    {
      hash: "624d69fda05ef03428a994f6a259f96e128f42460f74d304c2f3530128698b40",
      slot: 45418123,
    },
  ];

  findIntersect(lastBlocks);
}

function requestNextBlock() {
  client.NodeToClientChainSync.requestNext();
}

function findIntersect(data) {
  client.NodeToClientChainSync.findIntersect(data);
}

client.on("connect", () => {
  initiate();
});

client.on("disconnect", () => {
  console.log("cnode disconnected");
});

async function onData(response) {
  if (response.intersectNotFound) {
    console.log("intersection not found");
    process.exit();
  }

  if (response.intersectFound) {
    console.log("intersection found, requesting next block");
    requestNextBlock();
  }

  if (response.rollForward) {
    console.log('--------');
    console.log(response.rollForward.block.toString("hex"));
    console.log('--------');

    const blockData = cbors.Decoder.decode(response.rollForward.block).value;    
    
    console.log("--------");
    const version = blockData[0];
    console.log("version - ", version);
    console.log("--------");

    const parsedBlock = BabbageParser.parseBlock(
      blockData[1],
      response.rollForward.block
    );

    console.log(
      util.inspect(parsedBlock, {
        showHidden: false,
        depth: null,
        colors: true,
      })
    );

    requestNextBlock();
    return;
  }
  if (response.rollBackward) {
    console.log(
      "Rollback ",
      response.rollBackward.point.hash,
      response.rollBackward.point.slot
    );
    requestNextBlock();
    return;
  }
}

client.NodeToClientChainSync.on("data", onData);
