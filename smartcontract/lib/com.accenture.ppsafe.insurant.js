/**
* 创建一般用户账号（投保人/受保人）
* prototype中，投保人与受保人为同一人
* @param {com.accenture.ppsafe.createInsurant} insurant 投保人/受保人
* @transaction
*/
async function createInsurant(insurant) {

    const insurantRegistry = await getParticipantRegistry(INSURANT_REGISTRY);
    const walletRegistry = await getAssetRegistry(WALLET_REGISTRY);

    // 判断是否存在
    let isExist = await insurantRegistry.exists(insurant.id)
    if (isExist) {
        throw new TransactionError('E0005', 'insurant ' + insurant.id + ' is exist!');
        // return 'insurant ' + insurant.id + ' is exist!';
    }

    let newInsurant = await getFactory().newResource(NS, 'Insurant', insurant.id);
    let newInsurantWallet = await getFactory().newResource(NS, 'Wallet', insurant.id+'wallet');

    newInsurantWallet.balance = insurant.balance;
    await walletRegistry.add(newInsurantWallet);

    newInsurant.wallet = newInsurantWallet.id;
    newInsurant.regist_datetime = new Date();
    newInsurant.credit = insurant.credit;
    await insurantRegistry.add(newInsurant);
}
