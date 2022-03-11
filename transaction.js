class Transaction {
  constructor(data) {
    this.from = data.from; // 보내는 사람
    this.to = data.to; // 받는 사람
    this.amount = data.amount; // 받는 양
    this.timestamp = Date.now(); // 시간
  }
}

module.exports = Transaction;
