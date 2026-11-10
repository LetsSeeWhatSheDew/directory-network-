// Round 2 · "The Vault" — the deal opened in place, plus three more that open on tap.
import { getPreviewData } from "../../data";
import { VaultShell, VaultHero, VaultRow, VaultAct } from "../parts";

export default async function VaultDeal() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <VaultShell>
      {d ? <VaultHero d={d} hist={data.history} open /> : null}
      <h2 className="vt-h2" data-keep-font="">
        Also today · {data.dealCount} deals at {data.storesWithDeals} of {data.storeCount} stores
      </h2>
      {data.more.map((m) => (
        <VaultRow key={m.id} d={m} />
      ))}
      <div className="vt-spacer" />
      {d ? <VaultAct d={d} /> : null}
    </VaultShell>
  );
}
