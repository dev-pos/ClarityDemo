
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.4.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
    name: "Disburses tokens once it can claim the time-locked wallet balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const beneficiary = `${deployer.address}.smart-claimant`
        const wallet1 = accounts.get("wallet_1")!;
        const wallet2 = accounts.get("wallet_2")!;
        const wallet3 = accounts.get("wallet_3")!;
        const wallet4 = accounts.get("wallet_4")!;
        const unlock_height = 10;
        const amount = 1000;
        const share = Math.floor(amount/4);
        chain.mineBlock([
            Tx.contractCall("timelocked-wallet", "lock", [
                types.principal(beneficiary),
                types.uint(unlock_height),
                types.uint(amount),
            ], deployer.address),
        ]);

        chain.mineEmptyBlockUntil(unlock_height);

        const block = chain.mineBlock([
            Tx.contractCall("smart-claimant", "claim", [], deployer.address),
        ]);

        const [receipt] = block.receipts;

        receipt.result.expectOk().expectBool(true)

        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet1.address);
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet2.address);
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet3.address);
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet4.address);
    },
});
