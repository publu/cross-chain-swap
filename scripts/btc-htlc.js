const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function sha256(hex) {
  return crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex');
}

function createHtlcScript(receiverPubkey, makerPubkey, hashlock, timeout) {
  const script = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
      Buffer.from(receiverPubkey, 'hex'),
      bitcoin.opcodes.OP_CHECKSIGVERIFY,
      bitcoin.opcodes.OP_SHA256,
      Buffer.from(hashlock, 'hex'),
      bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(timeout),
      bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
      bitcoin.opcodes.OP_DROP,
      Buffer.from(makerPubkey, 'hex'),
      bitcoin.opcodes.OP_CHECKSIGVERIFY,
    bitcoin.opcodes.OP_ENDIF,
  ]);
  return script;
}

function htlcAddress(script, network) {
  const { address } = bitcoin.payments.p2wsh({ redeem: { output: script }, network });
  return address;
}

function main() {
  const network = bitcoin.networks.testnet;
  const receiver = process.argv[2];
  const maker = process.argv[3];
  const timeout = parseInt(process.argv[4]);
  if (!receiver || !maker || !timeout) {
    console.error('Usage: node btc-htlc.js <receiverPubKey> <makerPubKey> <timeout>');
    process.exit(1);
  }

  const secret = generateSecret();
  const hashlock = sha256(secret);
  const script = createHtlcScript(receiver, maker, hashlock, timeout);
  const address = htlcAddress(script, network);

  console.log('Secret:', secret);
  console.log('Hashlock:', hashlock);
  console.log('HTLC address:', address);
  console.log('Redeem script:', script.toString('hex'));
}

main();
