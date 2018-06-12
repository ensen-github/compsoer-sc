function TransactionError(errorCode, message) {
    this.name = "TransactionError";
    this.message = errorCode + ":" + (message || "");
}
TransactionError.prototype = Object.create(Error.prototype);
TransactionError.prototype.constructor = TransactionError;
