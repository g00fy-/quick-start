import { test, expect } from 'vitest';
import { createMemoryClient } from 'tevm'
import { fallback, getAddress, http, parseUnits, } from 'viem';

const alice = getAddress('0xdfCBc7f8dA0F5AAFCe7BCD1BD1c5Bfc25d934EDd');
const bob = getAddress('0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6');

const client = createMemoryClient({
    // loggingLevel: 'debug',
    account: alice,
    miningConfig: {
        type: 'auto'
    },
		// test works if I remove fork property
		// else I'm getting:
		// RevertError: revert
		// Docs: https://tevm.sh/reference/tevm/errors/classes/reverterror/
		// Details: {"error":"revert","errorType":"EvmError"}
		// Version: 1.1.0.next-73
    fork: {
        transport: fallback([
            http('https://cloudflare-eth.com'),
            http('https://eth.llamarpc.com'),
            http('https://rpc.ankr.com/eth'),
            http('https://ethereum.publicnode.com'),
        ], {
            retryCount: 3,
            retryDelay: 1000,
        })({})
    }
})

test('actions',{ retry: 0 }, async () => {
    // ensuring impersonated account is correct
    // Q: why do I need to call impersonateAccount when account was already provided on client ?
    await client.impersonateAccount({ address: alice });
    const impersonatedAccount = client.tevm.getImpersonatedAccount();
    expect(impersonatedAccount).toBe(alice);

    // setting balance to 1 eth
    await client.tevmSetAccount({
        address: alice,
        balance: parseUnits('1', 18)
    });
    const balance0 = await client.getBalance({ address: alice });
    expect(balance0).toEqual(parseUnits('1', 18));

    // sending some ETH to bob
    // Q: why can't I call  client.sendTransaction() ?
    const transactionResponse = await client.tevmCall(
        {
            to: bob,
            from: alice,
            value: parseUnits('0.01', 18),
            createTransaction: true,
        },
    )
    expect(transactionResponse).toBeDefined();
    const balance1 = await client.getBalance({
        address: alice,
    })
    expect(balance1).toBeLessThan(balance0)
})