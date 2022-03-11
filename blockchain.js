const Block = require("./block");
const { BN } = require("bn.js");
const Transaction = require("./transaction");

class BlockChain {
  constructor() {
    this.HANDICAP = 0x4000000;
    this.blockChain = [Block.getGenesis()];
    this.transactions = []; // 트랜잭션을 모음
    this.mempool = []; // 임시 트랜잭션을 모음
    this.user = "COINBASE"; // 유저
    // 만약에 블록생성시간이 20초 보다 높으면 난이도를 1/4배 해주고 20초보다 낮으면 4배를 해준다
    this.wantedTimeSecond = 20; // 난이도 조절 기준 시간
    this.wantedBlockCount = 10; // 난이도 조절 기준 블록 개수
    this.multipleNumber = 4; // 난이도 증가 혹은 감소 배수
  }

  // 트랜잭션을 mempool에 추가한다
  addTx(tx) {
    this.mempool.push(tx);
    console.log("트랜잭션을 멤풀에 추가함", tx);
  }

  // 블록을 블록체인에 추가한다
  addBlock(newBlock) {
    this.blockChain.push(newBlock);
    console.log("블록체인에 블록을 추가함", newBlock);
  }

  // 목표값을 구함
  getTarget(bits) {
    let bits16 = parseInt("0x" + bits.toString(16), 16);
    let exponent = bits16 >> 24;
    let mantissa = bits16 & 0xffffff;
    let target = mantissa * 2 ** (8 * (exponent - 3));
    let target16 = target.toString(16);
    let k = Buffer.from("0".repeat(64 - target16.length) + target16, "hex");
    return k.toString("hex");
  }

  getHandicapTarget(bits) {
    return this.getTarget(bits + this.HANDICAP);
  }

  // bits를 통해서 난이도를 구함
  bitsToDifficulty(bits) {
    const maximumTarget = "0x00000000ffff" + "0".repeat(64 - 12);
    const currentTarget = "0x" + this.getTarget(bits);
    return parseInt(maximumTarget, 16) / parseInt(currentTarget, 16);
  }

  // 난이도를 통해서 bits를 구하는 함수
  difficultyToBits(difficulty) {
    const maximumTarget = "0x00000000ffff" + "0".repeat(64 - 12);
    const difficulty16 = difficulty.toString(16);
    let target = parseInt(maximumTarget, 16) / parseInt(difficulty16, 16);
    let num = new BN(target.toString(16), "hex");
    let compact, nSize, bits;
    nSize = num.byteLength();
    if (nSize <= 3) {
      compact = num.toNumber();
      compact <<= 8 * (3 - nSize);
    } else {
      compact = num.ushrn(8 * (nSize - 3)).toNumber();
    }
    if (compact & 0x800000) {
      compact >>= 8;
      nSize++;
    }
    bits = (nSize << 24) | compact;
    if (num.isNeg()) {
      bits |= 0x800000;
    }
    bits >>>= 0;
    return parseInt(bits.toString(10));
  }

  getLastBlock() {
    return this.blockChain[this.blockChain.length - 1];
  }

  // 자가제한시스템을 통해서 가져오는 난이도입니다
  getDifficulty(bits) {
    let difficulty = this.bitsToDifficulty(bits);
    const lastBlock = this.getLastBlock();
    // 자가제한시스템이 여기서 완성됨 10개
    if (lastBlock.index > 0 && lastBlock.index % this.wantedBlockCount == 0) {
      console.log(`현재난이도: ${difficulty}`);
      let reTargetTime =
        this.blockChain[this.blockChain.length - this.wantedBlockCount]
          .timestamp;
      let lastTime = lastBlock.timestamp;
      let elaspedTime =
        (lastTime - reTargetTime) / this.wantedBlockCount / 1000; // 블록을 10개 생성시 평균 시간
      console.log(`평균 블록 생성 시간: ${elaspedTime}초`);
      if (elaspedTime > this.wantedTimeSecond) {
        difficulty = difficulty / this.multipleNumber;
      } else {
        difficulty = difficulty * this.multipleNumber;
      }
      console.log(`최종 난이도: ${difficulty}`);
    }
    return difficulty;
  }

  mining() {
    console.log("채굴 시작!");
    this.transactions = this.mempool; // 트랜잭션을 임시로 보관하고 있는 멤풀에서 트랜잭션으로 데이터를 옮기고
    this.mempool = []; // 멤풀을 비워줌
    const lastBlock = this.getLastBlock(); // 마지막 블록을 얻어오고
    // 새로운 블록을 만들어 줍니다.
    const newBlock = new Block({
      index: lastBlock.index + 1,
      previousHash: lastBlock.hash, // 체이닝
      timestamp: Date.now(),
      transactions: this.transactions, // 트랜잭션을 모아둡니다 -> body
      nonce: 0, // 해시퍼즐정답
    });
    const bits = lastBlock.bits;
    const target = this.getHandicapTarget(bits);
    console.log("목표값:", target);
    while (target <= newBlock.getHash()) {
      newBlock.nonce++;
    }
    // 자가제한 시스템
    const difficulty = this.getDifficulty(bits);
    // 해시를 넣어줌
    newBlock.hash = newBlock.getHash();
    newBlock.bits = this.difficultyToBits(difficulty);
    newBlock.difficulty = difficulty;
    console.log("새로운 블록:", newBlock);
    this.transactions = []; // 바디부분을 비워줌
    return newBlock;
  }
}

const tx1 = new Transaction({ from: "Alice", to: "Bob", amount: 50 });
const tx2 = new Transaction({ from: "Alice", to: "Bob", amount: 50 });
const tx3 = new Transaction({ from: "Bob", to: "Alice", amount: 50 });

const bc = new BlockChain();

while (bc.blockChain.length < 50) {
  bc.addTx(tx1);
  bc.addTx(tx2);
  bc.addTx(tx3);
  const newBlock = bc.mining();
  bc.addBlock(newBlock);
}
