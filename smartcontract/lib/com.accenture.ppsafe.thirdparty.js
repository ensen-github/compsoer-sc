/**
* 创建第三方用户账号（审核人员）
* prototype中，只有一位审核人员
* @param {com.accenture.ppsafe.createThirdPartyUser} thirdpartyUser 审核人员
* @transaction
*/
async function createThirdPartyUser(thirdpartyUser) {

    const thirdPartyUserRegistry = await getParticipantRegistry(THIRDPARTYUSER_REGISTRY);
    const walletRegistry = await getAssetRegistry(WALLET_REGISTRY);

    // 判断是否存在
    let isExist = await thirdPartyUserRegistry.exists(thirdpartyUser.id)
    if (isExist) {
        throw new TransactionError('E0013', 'insurant ' + thirdpartyUser.id + ' is exist!');
        // return 'insurant ' + thirdpartyUser.id + ' is exist!';
    }

    let newThirdPartyUser = await getFactory().newResource(NS, 'ThirdPartyUser', thirdpartyUser.id);
    let newThirdPartyWallet = await getFactory().newResource(NS, 'Wallet', thirdpartyUser.id+'wallet');

    await walletRegistry.add(newThirdPartyWallet);

    newThirdPartyUser.wallet = newThirdPartyWallet.id;
    newThirdPartyUser.regist_datetime = new Date();
    await thirdPartyUserRegistry.add(newThirdPartyUser);
}
