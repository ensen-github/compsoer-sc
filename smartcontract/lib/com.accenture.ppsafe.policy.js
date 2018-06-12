/**
* 创建房屋漏水险的保单（投保人/受保人）
* prototype中，投保人与受保人为同一人
* @param {com.accenture.ppsafe.createLeakagePolicy} leakagePolicy 房屋漏水险保单
* @transaction
*/
async function createLeakagePolicy(leakagePolicy) {

    const insurantRegistry = await getParticipantRegistry(INSURANT_REGISTRY);
    const insuranceRegistry = await getAssetRegistry(INSURANCE_REGISTRY);
    const leakagePolicyRegistry = await getAssetRegistry(LEAKAGEPOLICY_REGISTRY);

    // 判断保单是否存在
    let isExist = await leakagePolicyRegistry.exists(leakagePolicy.id)
    if (isExist) {
        throw new TransactionError('E0006', 'leakage policy ' + leakagePolicy.id + ' is exist!');
        // return 'leakage policy ' + leakagePolicy.id + ' is exist!';
    }

    // 判断投保人是否存在
    isExist = await insurantRegistry.exists(leakagePolicy.policyHolderId)
    if (!isExist) {
        throw new TransactionError('E0007', 'Policy holder ' + leakagePolicy.policyHolderId + ' is not exist!');
        // return 'Policy holder ' + leakagePolicy.policyHolderId + ' is not exist!';
    }
    // 判断受保人是否存在
    isExist = await insurantRegistry.exists(leakagePolicy.insurantId)
    if (!isExist) {
        throw new TransactionError('E0008', 'Insurant ' + leakagePolicy.insurantId + ' is not exist!');
        // return 'Insurant ' + leakagePolicy.insurantId + ' is not exist!';
    }

    // 判断险种是否存在
    isExist = await insuranceRegistry.exists(leakagePolicy.insuranceId)
    if (!isExist) {
        throw new TransactionError('E0009', 'Insurance ' + leakagePolicy.insuranceId + ' is not exist!');
        // return 'Insurance ' + leakagePolicy.insuranceId + ' is not exist!';
    }

    let newLeakagePolicy = await getFactory().newResource(NS, 'LeakagePolicy', leakagePolicy.id);
    newLeakagePolicy.insurance = leakagePolicy.insuranceId;
    newLeakagePolicy.policyHolder = leakagePolicy.policyHolderId;
    newLeakagePolicy.insurant = leakagePolicy.insurantId;
    newLeakagePolicy.premium = leakagePolicy.premium;
    newLeakagePolicy.quantity = leakagePolicy.quantity;
    newLeakagePolicy.houseNumber = leakagePolicy.houseNumber;
    newLeakagePolicy.houseAddress = leakagePolicy.houseAddress;
    newLeakagePolicy.create_datetime = new Date();

    await leakagePolicyRegistry.add(newLeakagePolicy);
}

/**
* 转账
* @param {com.accenture.ppsafe.buyPolicyPay} payment 转账
* @transaction
*/
async function buyPolicyPay(payment) {

    const insurantRegistry = await getParticipantRegistry(INSURANT_REGISTRY);
    const policyRegistry = await getAssetRegistry(LEAKAGEPOLICY_REGISTRY);
    const insuranceRegistry = await getAssetRegistry(INSURANCE_REGISTRY);
    const walletRegistry = await getAssetRegistry(WALLET_REGISTRY);

    // 判断保单是否存在
    let isExist = await policyRegistry.exists(payment.policyId)
    if (!isExist) {
        throw new TransactionError('E0010', 'leakage policy ' + payment.policyId + ' is not exist!');
        // return 'leakage policy ' + payment.policyId + ' is not exist!';
    }

    // 判断投保人是否存在
    isExist = await insurantRegistry.exists(payment.policyHolderId)
    if (!isExist) {
        throw new TransactionError('E0011', 'Policy holder ' + payment.policyHolderId + ' is not exist!');
        // return 'Policy holder ' + payment.policyHolderId + ' is not exist!';
    }

    const insurant = await insurantRegistry.get(payment.policyHolderId);
    const policy =  await policyRegistry.get(payment.policyId);
    const insurance = await insuranceRegistry.get(policy.insurance);

    const insurantWallet = await walletRegistry.get(insurant.wallet);
    const insuranceWallet = await walletRegistry.get(insurance.wallet);

    await transfer(insurant.id, insurantWallet, insuranceWallet, payment.amount, 'TRANSFER');

    insurantWallet.balance -= payment.amount;
    if (insurantWallet.balance <= 0) {
        throw new TransactionError('E0012', 'Lack of balance! insurant:' + insurant.id);
        // return 'Lack of balance! insurant:' + insurant.id;
    }

    insuranceWallet.balance += payment.amount;
    policy.payStatus = "PAID";

    await policyRegistry.update(policy);
    await walletRegistry.update(insurantWallet);
    await walletRegistry.update(insuranceWallet);
}

