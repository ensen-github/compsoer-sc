/**
* 创建一个险种的Asset（同种同期保险专用资金池账号）
* prototype中，只创建一个房屋漏水险
* @param {com.accenture.ppsafe.createInsurance} insurance 险种Asset
* @transaction
*/
async function createInsurance(insurance) {

    const insuranceRegistry = await getAssetRegistry(INSURANCE_REGISTRY);
    const walletRegistry = await getAssetRegistry(WALLET_REGISTRY);

    // 判断是否存在
    let isExist = await insuranceRegistry.exists(insurance.id)
    if (isExist) {
        throw new TransactionError('E0004', 'insurance ' + insurance.id + ' is exist!');
        // return 'insurance ' + insurance.id + ' is exist!';
    }

    let newInsurance = await getFactory().newResource(NS, 'Insurance', insurance.id);
    let newInsuranceWallet = await getFactory().newResource(NS, 'Wallet', insurance.id+'wallet');

    await walletRegistry.add(newInsuranceWallet);

    newInsurance.ins_type = insurance.ins_type;
    newInsurance.unit_price = insurance.unit_price;
    newInsurance.description = insurance.description;
    newInsurance.start_time = insurance.start_time;
    newInsurance.end_time = insurance.end_time;
    newInsurance.isClosed = insurance.isClosed;
    newInsurance.ins_close_datetime = insurance.ins_close_datetime;
    newInsurance.create_datetime = new Date();
    newInsurance.lowest_credit = insurance.lowest_credit;
    newInsurance.wallet = newInsuranceWallet.id;
    await insuranceRegistry.add(newInsurance);
}
