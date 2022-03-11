const hashs = require("hash.js"); // 다른사람이 만든 모듈

// 블록 설계도
class Block {
  constructor(data) {
    if (!data) return;
    this.index = data.index;
    this.previousHash = data.previousHash;
    this.timestamp = data.timestamp;
    this.nonce = data.nonce;
    this.transactions = data.transactions; // merkle, body
    this.bits = data.bits; // x
    this.difficulty = data.difficulty;
    this.hash = data.hash;
  }

  static getGenesis() {
    const data = {
      index: 0,
      previousHash: 0,
      timestamp: Date.now(),
      transactions: [],
      bits: 486604799,
      difficulty: 1,
      nonce: 0,
      hash: "GENESIS BLOCK",
    };
    const genesisBlock = new Block(data);
    return genesisBlock;
  }

  getHash() {
    const encryptData = hashs
      .sha256()
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          this.transactions +
          this.nonce
      )
      .digest("hex");
    return encryptData;
  }
}

module.exports = Block;
