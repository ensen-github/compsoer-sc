/**
* 创建理赔申请单
* @param {com.accenture.ppsafe.createClaim} claim 审核人员
* @transaction
*/
async function createClaim(claim) {
    const claimRegistry = await getAssetRegistry(CLAIM_REGISTRY);
    const policyRegistry = await getAssetRegistry(LEAKAGEPOLICY_REGISTRY);

    // 判断是否存在
    let isExist = await policyRegistry.exists(claim.policyId);
    if (!isExist) {
        throw new TransactionError('E0001', 'policy ' + claim.policyId + ' is not exist!');
        // return 'policy ' + claim.policyId + ' is not exist!';
    }

    let newClaim = await getFactory().newResource(NS, 'Claim', claim.id);

    newClaim.claimer = claim.claimerId;
    newClaim.policy = claim.policyId;
    newClaim.claim_request_datetime = new Date();
    newClaim.happen_datetime = claim.happen_datetime;
    newClaim.claim_reason = claim.claim_reason;
    newClaim.claim_file_id = claim.claim_file_id;
    newClaim.claim_file_name = claim.claim_file_name;
    newClaim.claim_benefit = claim.claim_benefit;
    await claimRegistry.add(newClaim);

    let policy = await policyRegistry.get(claim.policyId);
    policy.claim = newClaim;
    await policyRegistry.update(policy);
}


/**
* 审核理赔申请单
* @param {com.accenture.ppsafe.reviewClaim} reviewClaim 审核结果
* @transaction
*/
async function reviewClaim(reviewClaim) {
    const reviewerRegistry = await getParticipantRegistry(THIRDPARTYUSER_REGISTRY);

    const claimRegistry = await getAssetRegistry(CLAIM_REGISTRY);
    const insuranceRegistry = await getAssetRegistry(INSURANCE_REGISTRY);
    const leakagePolicyRegistry = await getAssetRegistry(LEAKAGEPOLICY_REGISTRY);
    const walletRegistry = await getAssetRegistry(WALLET_REGISTRY);
    const thirdPartyUserRegistry = await getParticipantRegistry(THIRDPARTYUSER_REGISTRY);
    const insurantRegistry = await getParticipantRegistry(INSURANT_REGISTRY);

    // 判断是否存在
    let isExist = await leakagePolicyRegistry.exists(reviewClaim.policyId)
    if (!isExist) {
        throw new TransactionError('E0002', 'Policy ' + reviewClaim.policyId + ' is not exist!');
    }
    const policy = await leakagePolicyRegistry.get(reviewClaim.policyId);
    if (policy.claim == null || reviewClaim.claimId !== policy.claim.$identifier) {
        throw new TransactionError('E0003', 'Claim ' + reviewClaim.claimId + ' is not exist!');
    }

    const claim = await claimRegistry.get(reviewClaim.claimId);

    // 更新理赔申请单
    claim.review_start_datetime = new Date();
    claim.reviewer = reviewClaim.reviewerId;
    claim.result = reviewClaim.result;
    claim.status = 'CLOSED';
    claim.review_comment = reviewClaim.review_comment;

    // 审核手续费转账
    const insurance = await insuranceRegistry.get(policy.insurance);
    const reviewer = await thirdPartyUserRegistry.get(reviewClaim.reviewerId);

    const insurant = await insurantRegistry.get(policy.insurant);
    const insurantWallet = await walletRegistry.get(insurant.wallet);
    const insuranceWallet = await walletRegistry.get(insurance.wallet);
    const thirdpartyWallet = await walletRegistry.get(reviewer.wallet);

    await transfer(reviewer.id, insurantWallet, thirdpartyWallet, 100, 'FEE');
    claim.fee -= 100;
    if (reviewClaim.result === 'APPROVE') {
        await transfer(insurant.id, insuranceWallet, insurantWallet, claim.claim_benefit, 'INDEMNITY');

        // 赔款实际转账
        insuranceWallet.balance -= claim.claim_benefit;
        insuranceWallet.claimAmount -= claim.claim_benefit;
        insurantWallet.balance += claim.claim_benefit;
        insurantWallet.claimAmount += claim.claim_benefit;
    }
    // 信用值更新
    insurant.credit = reviewClaim.policyHolderCredit;
    await insurantRegistry.update(insurant);

    // 审核费用实际转账
    insurantWallet.balance -= 100;
    insurantWallet.fee -= 100;
    thirdpartyWallet.balance += 100;
    await walletRegistry.update(insurantWallet);
    await walletRegistry.update(insuranceWallet);
    await walletRegistry.update(thirdpartyWallet);
    await claimRegistry.update(claim);
    await leakagePolicyRegistry.update(policy);
}
