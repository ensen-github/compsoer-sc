function getUniqueId() {
    // TODO:ID生成に乱数を利用するとピア間で不整合になるため要見直し masatsugu.yamada
    var randomness = 1000;
    return new Date().getTime().toString(16) + Math.floor(randomness * Math.random()).toString(16);
}

async function transfer(requestId, sendWallet, recvWallet, amount, transferType) {

    const transferReceiptRegistry = await getAssetRegistry(TRANSFERRECEIPT_REGISTRY);
    var newReceiptSend = await getFactory().newResource(NS, "TransferReceipt", String(getUniqueId()));
    newReceiptSend.requester = requestId;
    newReceiptSend.receiptType = 'SENDING';
    newReceiptSend.transferType = transferType;
    newReceiptSend.transactionDate = new Date();

    newReceiptSend.senderWallet = sendWallet.id;
    newReceiptSend.receiverWallet = recvWallet.id;

    newReceiptSend.relatedWallet = sendWallet.id;
    newReceiptSend.amount -= amount;
    newReceiptSend.amountCurrency = 'RMB';
    newReceiptSend.beforeBalance = sendWallet.balance;
    await transferReceiptRegistry.add(newReceiptSend);

    var newReceiptRecv = await getFactory().newResource(NS, "TransferReceipt", String(getUniqueId()));
    newReceiptRecv.requester = requestId;
    newReceiptRecv.receiptType = 'RECEIVING';
    newReceiptRecv.transferType = transferType;
    newReceiptRecv.transactionDate = new Date();

    newReceiptRecv.senderWallet = sendWallet.id;
    newReceiptRecv.receiverWallet = recvWallet.id;

    newReceiptRecv.relatedWallet = recvWallet.id;
    newReceiptRecv.amount += amount;
    newReceiptRecv.amountCurrency = 'RMB';
    newReceiptRecv.beforeBalance = recvWallet.balance;
    await transferReceiptRegistry.add(newReceiptRecv);
}
